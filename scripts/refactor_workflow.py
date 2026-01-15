import json
import copy

# Paths
INPUT_PATH = r"c:\Users\Usuario\Downloads\PAPA.json"
OUTPUT_PATH = r"c:\Users\Usuario\Downloads\PAPA.json" # Overwrite directly

def main():
    try:
        with open(INPUT_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading input: {e}")
        return

    nodes = data.get('nodes', [])
    connections = data.get('connections', {})

    # 1. CLEANUP: Remove nodes from previous logic (or legacy)
    # We remove 'Check Availability', 'Is Available?', 'If1' (legacy filter), and legacy switches if they exist
    nodes_to_remove_names = {
        "Switch1", "Switch2", "If2", "If3", "If4", "If5", "If6",
        "If7", "If8", "If9", "If10", "If11", "If12",
        "Check Availability", "Is Available?", "If1",
        "Message Too Large",
        # Consolidating these:
        "Code in JavaScript", "Code in JavaScript1", "Code in JavaScript2", "Code in JavaScript3"
    }

    data['nodes'] = [n for n in nodes if n['name'] not in nodes_to_remove_names]
    
    # Clean require luxon from ALL existing nodes
    for node in data['nodes']:
        if 'parameters' in node and 'jsCode' in node['parameters']:
            code = node['parameters']['jsCode']
            lines = code.split('\n')
            new_lines = [l for l in lines if "require('luxon')" not in l]
            node['parameters']['jsCode'] = '\n'.join(new_lines)
    
    # Clean connections for removed nodes
    new_connections = {}
    for source, outputs in connections.items():
        if source in nodes_to_remove_names: continue
        
        new_source_outputs = {}
        if "main" in outputs:
            new_main = []
            for connection_list in outputs["main"]:
                new_list = [c for c in connection_list if c['node'] not in nodes_to_remove_names]
                new_main.append(new_list)
            # Remove trailing empty outputs if needed? n8n might need strict structure. 
            # We'll clean empty lists later or allow them.
            new_source_outputs["main"] = new_main
        
        # Copy other types
        for k, v in outputs.items():
            if k != "main": new_source_outputs[k] = v
            
        new_connections[source] = new_source_outputs
    
    data['connections'] = new_connections

    # 2. ADD NEW NODES

    # Node: Check Master Capacity (Code)
    check_master_capacity = {
        "parameters": {
            "jsCode": r"""

// INPUTS
const requestedPersons = parseInt($('AI Agent3').first().json.output.persona) || 1;
const requestedDateStr = $('AI Agent3').first().json.output.dia_cita; // YYYY-MM-DD
const requestedTimeStr = $('AI Agent3').first().json.output.hora_cita; // HH:MM

// 1. Validation for Large Groups (> 6)
if (requestedPersons > 6) {
    return { json: { status: "OVER_LIMIT" } };
}

// 2. Parse Requested Time
// Assumes format HH:MM
const [reqH, reqM] = requestedTimeStr.split(':').map(Number);
const reqMinutesStart = reqH * 60 + reqM;

// 3. Define Slots Required
// Persons 1-3: 1 Slot (30 mins)
// Persons 4-6: 2 Slots (60 mins)
const slotsRequired = requestedPersons > 3 ? 2 : 1;

// 4. Calculate Capacity
// Helper: Get Minute of day for a booking
const getBookingMinutes = (timeStr) => {
    if(!timeStr) return -1;
    // Handle HH:MM:SS or HH:MM
    const parts = timeStr.split(':');
    return parseInt(parts[0])*60 + parseInt(parts[1]);
};

// Filter Bookings for THIS DAY (from 'Get many rows')
// They are already filtered by Day in the supabase node, but good to be safe if that logic changes.
// We assume 'Get many rows' output is ALL bookings for the day.
const allBookings = $('Get many rows').all().map(item => item.json);

const MAX_CAPACITY_PER_SLOT = 3;

// We need to check 'slotsRequired' consecutive slots.
// Slot 1: reqMinutesStart
// Slot 2: reqMinutesStart + 30
let isAvailable = true;

for (let i = 0; i < slotsRequired; i++) {
    const currentSlotStart = reqMinutesStart + (i * 30);
    const currentSlotEnd = currentSlotStart + 29; // inclusive window
    
    // Count bookings in this slot
    let count = 0;
    for (const booking of allBookings) {
        const bM = getBookingMinutes(booking.Hora);
        if (bM >= currentSlotStart && bM <= currentSlotEnd) {
            count++;
        }
    }
    
    // Check constraint
    // If requestedPersons is 4-6, they effectively take up capacity in BOTH slots?
    // User logic: "chekee la aviabilidad de una hora entera ya que sería el doble de la capacidad (6)"
    // This implies: Size 4-6 fits into available capacity of (Slot A + Slot B) which is (3 + 3 = 6).
    // So distinct from "Does it fit in Slot A AND Slot B individually".
    // It's a SUM check.
    
    // However, we must ensure individual slots aren't overfilled in reality?
    // If Slot A has 3 people, and Slot B has 0. Total Cap 6. Available 3.
    // If we book 4 people:
    // They overlap Slot A (FULL) and Slot B (Empty).
    // Can we fit 4 people? 3 go to Slot A? No, it's a group.
    // Usually, you need N seats valid for the WHOLE duration.
    // BUT the user says: "sería el doble de la capacidad (6)".
    // Interpretation: Treat the 1-hour block as a single bucket of capacity 6.
    // So we Count(Slot A) + Count(Slot B).
    // Total Used vs Total Cap (6).
    // If (Used A + Used B + Requested) <= 6 -> OK.
}

// Let's implement the "Combined Capacity" logic for >3 people, and "Single Slot" for <=3.

if (requestedPersons <= 3) {
    // Standard Check
    let count = 0;
    const currentSlotEnd = reqMinutesStart + 29;
    for (const booking of allBookings) {
        const bM = getBookingMinutes(booking.Hora);
        if (bM >= reqMinutesStart && bM <= currentSlotEnd) {
            count++;
        }
    }
    if ((count + requestedPersons) > MAX_CAPACITY_PER_SLOT) {
        isAvailable = false;
    }
} else {
    // Large Group (4-6) -> Check 1 Hour (2 slots)
    // Slot 1
    let countA = 0;
    const endA = reqMinutesStart + 29;
    for (const booking of allBookings) {
        const bM = getBookingMinutes(booking.Hora);
        if (bM >= reqMinutesStart && bM <= endA) countA++;
    }
    
    // Slot 2
    let countB = 0;
    const startB = reqMinutesStart + 30;
    const endB = startB + 29;
    for (const booking of allBookings) {
        const bM = getBookingMinutes(booking.Hora);
        if (bM >= startB && bM <= endB) countB++;
    }
    
    const totalUsed = countA + countB;
    const totalCap = MAX_CAPACITY_PER_SLOT * 2; // 6
    if ((totalUsed + requestedPersons) > totalCap) {
        isAvailable = false;
    }
}

return {
    json: {
        status: isAvailable ? "OK" : "FULL",
        requestedPersons,
        requestedTimeStr
    }
};
"""
        },
        "name": "Check Capacity Master",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1520, -176],
        "id": "uuid-master-cap-check"
    }
    
    # Node: Routing Switch
    routing_switch = {
        "parameters": {
            "rules": {
                "values": [
                    {
                        "conditions": {
                            "options": {
                                "caseSensitive": True,
                                "leftValue": "",
                                "typeValidation": "strict",
                                "version": 3
                            },
                            "conditions": [
                                {
                                    "leftValue": "={{ $json.status }}",
                                    "rightValue": "OVER_LIMIT",
                                    "operator": { "type": "string", "operation": "equals" }
                                }
                            ],
                            "combinator": "and"
                        },
                        "renameOutput": True,
                        "outputKey": "OverLimit"
                    },
                    {
                        "conditions": {
                            "options": {
                                "caseSensitive": True,
                                "leftValue": "",
                                "typeValidation": "strict",
                                "version": 3
                            },
                            "conditions": [
                                {
                                    "leftValue": "={{ $json.status }}",
                                    "rightValue": "FULL",
                                    "operator": { "type": "string", "operation": "equals" }
                                }
                            ],
                            "combinator": "and"
                        },
                        "renameOutput": True,
                        "outputKey": "Full"
                    },
                    {
                        "conditions": {
                            "options": {
                                "caseSensitive": True,
                                "leftValue": "",
                                "typeValidation": "strict",
                                "version": 3
                            },
                            "conditions": [
                                {
                                    "leftValue": "={{ $json.status }}",
                                    "rightValue": "OK",
                                    "operator": { "type": "string", "operation": "equals" }
                                }
                            ],
                            "combinator": "and"
                        },
                        "renameOutput": True,
                        "outputKey": "Success"
                    }
                ]
            }
        },
        "name": "Capacity Switch",
        "type": "n8n-nodes-base.switch",
        "typeVersion": 3,
        "position": [1720, -176],
        "id": "uuid-cap-switch"
    }

    # Node: Message Too Large
    msg_too_large = {
        "parameters": {
            "message": "Lo siento, para grupos de más de 6 personas por favor llama directamente al 64534343 para gestionar tu reserva.",
            "waitUserReply": False,
            "options": {}
        },
        "name": "Message Too Large",
        "type": "@n8n/n8n-nodes-langchain.chat",
        "typeVersion": 1,
        "position": [1950, -350],
        "id": "uuid-msg-too-large"
    }

    # Node: Generate Suggestions (Consolidated)
    generate_suggestions = {
        "parameters": {
            "jsCode": r"""
// INPUTS
const requestedPersons = parseInt($('AI Agent3').first().json.output.persona) || 1;
const allBookings = $('Get many rows').all().map(item => item.json);
const MAX_CAPACITY_PER_SLOT = 3;

// Helper: Get Booking Minutes
const getBookingMinutes = (timeStr) => {
    if(!timeStr) return -1;
    const parts = timeStr.split(':');
    return parseInt(parts[0])*60 + parseInt(parts[1]);
};

const validSlots = [];

// Range: 10:00 to 21:00 (last booking start)
for (let h = 10; h <= 21; h++) {
    for (let m of [0, 30]) {
        const startMin = h * 60 + m;
        
        let isSlotAvailable = false;
        
        if (requestedPersons <= 3) {
            // Check 1 slot (30m)
            let count = 0;
            const endMin = startMin + 29;
            for (const b of allBookings) {
                const bM = getBookingMinutes(b.Hora);
                if (bM >= startMin && bM <= endMin) count++;
            }
            if ((count + requestedPersons) <= MAX_CAPACITY_PER_SLOT) {
                isSlotAvailable = true;
            }
        } else {
            // Check 2 slots (60m)
            const slot1Start = startMin;
            const slot2Start = startMin + 30;
            
            // Limit: If slot2 starts after closing (22:00 = 1320)
            if (slot2Start >= 1320) {
               isSlotAvailable = false; 
            } else {
                let countA = 0;
                let countB = 0;
                for (const b of allBookings) {
                    const bM = getBookingMinutes(b.Hora);
                    if (bM >= slot1Start && bM <= (slot1Start + 29)) countA++;
                    if (bM >= slot2Start && bM <= (slot2Start + 29)) countB++;
                }
                
                if ((countA + countB + requestedPersons) <= (MAX_CAPACITY_PER_SLOT*2)) {
                    isSlotAvailable = true;
                }
            }
        }
        
        if (isSlotAvailable) {
            const minStr = m === 0 ? '00' : '30';
            validSlots.push(`${h}:${minStr}`);
        }
    }
}

// SUFFLE & PICK 3
if (validSlots.length > 3) {
    for (let i = validSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validSlots[i], validSlots[j]] = [validSlots[j], validSlots[i]];
    }
}
const selected = validSlots.slice(0, 3);
// Sort chronologically
selected.sort((a,b) => {
    const [h1,m1] = a.split(':').map(Number);
    const [h2,m2] = b.split(':').map(Number);
    return (h1*60+m1) - (h2*60+m2);
});

return {
    json: {
        horas_sugeridas: selected.join(", ")
    }
};
"""
        },
        "name": "Generate Suggestions",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1950, -100],
        "id": "uuid-gen-suggestions"
    }

    data['nodes'].append(check_master_capacity)
    data['nodes'].append(routing_switch)
    data['nodes'].append(msg_too_large)
    data['nodes'].append(generate_suggestions)

    # 3. WIRING
    # Helper
    def add_conn(src, tgt, idx=0, out_idx=0):
        if src not in data['connections']: data['connections'][src] = {}
        if "main" not in data['connections'][src]: data['connections'][src]["main"] = []
        while len(data['connections'][src]["main"]) <= out_idx:
            data['connections'][src]["main"].append([])
        data['connections'][src]["main"][out_idx].append({"node": tgt, "type": "main", "index": idx})

    # Get many rows -> Check Capacity Master
    add_conn("Get many rows", "Check Capacity Master", 0, 0)
    
    # Check Capacity Master -> Capacity Switch
    add_conn("Check Capacity Master", "Capacity Switch", 0, 0)
    
    # Switch Output 0 (OverLimit) -> Message Too Large
    add_conn("Capacity Switch", "Message Too Large", 0, 0)
    
    # Switch Output 1 (Full) -> Generate Suggestions
    add_conn("Capacity Switch", "Generate Suggestions", 0, 1)
    
    # Switch Output 2 (Success) -> Code in JavaScript5 (Booking Loop)
    add_conn("Capacity Switch", "Code in JavaScript5", 0, 2)
    
    # Generate Suggestions -> Respond to Chat1
    add_conn("Generate Suggestions", "Respond to Chat1", 0, 0)
    
    # Save
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    print("Refactoring Phase 2 Complete.")

if __name__ == "__main__":
    main()
