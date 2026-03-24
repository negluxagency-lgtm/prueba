import os
import json
import re
from datetime import datetime

def check_env_vars():
    env_path = r"c:\Users\Usuario\nextjs\.env.local"
    required_keys = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
        "RECAPTCHA_SECRET_KEY",
        "RECAPTCHA_PROJECT_ID"
    ]
    results = {}
    if not os.path.exists(env_path):
        return {"status": "CRITICAL", "message": ".env.local missing"}
    
    with open(env_path, "r") as f:
        content = f.read()
        for key in required_keys:
            if key in content:
                match = re.search(fr"{key}\s*=\s*(.+)", content)
                if match and match.group(1).strip():
                    results[key] = "PRESENT"
                else:
                    results[key] = "EMPTY"
            else:
                results[key] = "MISSING"
                
    # Stripe Mode Check
    stripe_key = ""
    with open(env_path, "r") as f:
        for line in f:
            if line.startswith("STRIPE_SECRET_KEY"):
                stripe_key = line.split("=")[1].strip()
    
    stripe_status = "UNKNOWN"
    if stripe_key.startswith("sk_live"):
        stripe_status = "LIVE"
    elif stripe_key.startswith("sk_test"):
        stripe_status = "TEST"
        
    results["STRIPE_MODE"] = stripe_status
    
    status = "SUCCESS"
    if any(v == "MISSING" for v in results.values()):
        status = "CRITICAL"
    elif stripe_status == "LIVE" and "Test Mode" in content: # Heuristic check
        status = "WARNING"
        results["STRIPE_MODE"] = "LIVE_WITH_TEST_LABELS"
        
    return {"status": status, "details": results}

def check_routes():
    base_app = r"c:\Users\Usuario\nextjs\app"
    landing_path = os.path.join(base_app, "(landing)", "page.tsx")
    
    # Mapping route to possible file paths
    critical_routes = {
        "pricing": ["pricing/page.tsx"],
        "reserva": ["cita/page.tsx", "cita/[uuid]/page.tsx"],
        "perfil": ["(dashboard)/perfil/page.tsx", "perfil/page.tsx", "configuracion/page.tsx"],
        "dashboard": ["(dashboard)/inicio/page.tsx", "dashboard/page.tsx"]
    }
    results = {}
    
    def file_exists_in_app(rel_path):
        return os.path.exists(os.path.join(base_app, rel_path))

    for route, paths in critical_routes.items():
        found = False
        for p in paths:
            if file_exists_in_app(p):
                found = True
                break
        results[route] = "EXISTS" if found else "MISSING"
            
    # Legal Check (External)
    legal_external = False
    if os.path.exists(landing_path):
        with open(landing_path, "r", encoding="utf-8") as f:
            content = f.read()
            if "https://nelux.es" in content and "Nelux" in content:
                legal_external = True
    
    results["legal_link"] = "PRESENT (nelux.es)" if legal_external else "MISSING"
            
    status = "SUCCESS"
    if not legal_external and not file_exists_in_app("politica-de-privacidad/page.tsx"):
        status = "CRITICAL"
    elif any(v == "MISSING" for v in results.values()):
        status = "WARNING"
        
    return {"status": status, "details": results}

def check_security_patterns():
    # Check for session guards in actions
    results = {"auth_guards": "UNKNOWN"}
    
    # We'll just check if middleware exists for now
    middleware_path = r"c:\Users\Usuario\nextjs\middleware.ts"
    if os.path.exists(middleware_path):
        results["middleware"] = "PRESENT"
    else:
        results["middleware"] = "MISSING"
        
    status = "SUCCESS" if results["middleware"] == "PRESENT" else "CRITICAL"
    return {"status": status, "details": results}

def main():
    print("INFO: Inicializando motor de auditoria AUDIT-LAUNCH v3.0...")
    
    checks_data = {
        "environment": check_env_vars(),
        "routes": check_routes(),
        "security": check_security_patterns()
    }
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "checks": checks_data
    }
    
    # Final verdict
    statuses = [c["status"] for c in checks_data.values()]
    if "CRITICAL" in statuses:
        report["verdict"] = "NOT_READY"
    elif "WARNING" in statuses:
        report["verdict"] = "NEEDS_ATTENTION"
    else:
        report["verdict"] = "READY_FOR_MARKET"
        
    output_path = r"c:\Users\Usuario\nextjs\artifacts\audit_report.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(report, f, indent=4)
        
    print(f"INFO: Auditoria v3.0 completada. Reporte materializado en {output_path}")
    print(f"INFO: Veredicto: {report['verdict']}")

if __name__ == "__main__":
    main()
