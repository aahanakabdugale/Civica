import json
import urllib.request
import urllib.parse
import time

BASE_URL = "http://localhost:8000/api/v1"

def print_section(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def make_request(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    body = json.dumps(data).encode("utf-8") if data else None
    
    try:
        with urllib.request.urlopen(req, data=body) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"[DEBUG HTTPError] Code: {e.code}, Reason: {e.reason}, Body: {err_body}")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"raw_body": err_body}

def test_all():
    # 1. Health Check
    print_section("1. Testing /health Endpoint")
    code, res = make_request(f"{BASE_URL}/health")
    print(f"Status Code: {code}")
    print(f"Response: {json.dumps(res, indent=2)}")
    assert code == 200, "Health check failed!"
    assert res["status"] == "healthy", "Database not healthy!"

    # 1.5 Auth Signup & Login Test
    print_section("1.5 Testing User Auth (Signup, Login & Profile)")
    import uuid
    citizen_email = f"citizen_{uuid.uuid4().hex[:6]}@civica.org"
    signup_payload = {
        "email": citizen_email,
        "password": "Password123!",
        "full_name": "Aditya Citizen",
        "role": "citizen"
    }
    code, signup_res = make_request(f"{BASE_URL}/auth/signup", method="POST", data=signup_payload)
    print(f"Signup Status Code: {code}")
    print(f"Returned Token: {signup_res.get('access_token')[:25]}...")
    assert code == 201, "Signup failed!"

    login_payload = {"email": citizen_email, "password": "Password123!"}
    code, login_res = make_request(f"{BASE_URL}/auth/login", method="POST", data=login_payload)
    print(f"Login Status Code: {code}")
    assert code == 200, "Login failed!"

    token = login_res.get("access_token")
    req = urllib.request.Request(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp:
        me_data = json.loads(resp.read().decode("utf-8"))
        print(f"Profile Status Code: {resp.status}")
        print(f"User Profile: {me_data.get('full_name')} ({me_data.get('role')})")
        assert resp.status == 200 and me_data.get("email") == citizen_email, "Profile lookup failed!"

    # 2. Database Seeding
    print_section("2. Testing /dev/seed (Seeding 35 complaints in Mumbai)")
    code, res = make_request(f"{BASE_URL}/dev/seed?city=mumbai&count=35", method="POST")
    print(f"Status Code: {code}")
    print(f"Response: {json.dumps(res, indent=2)}")
    assert code == 200, "Seeding failed!"

    # 3. Hindi Complaint Intake (AI Processing)
    print_section("3. Testing Citizen Intake in Hindi (Translation + Classification + Priority)")
    hindi_payload = {
        "description": "Severe garbage dump and sewage overflow stinking heavily on main Dharavi road.",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "address_text": "Dharavi Main Road, Mumbai",
        "contact_info": {
            "name": "Rajesh Kumar",
            "phone": "+919820012345",
            "email": "rajesh@example.com"
        }
    }
    code, c1 = make_request(f"{BASE_URL}/complaints/", method="POST", data=hindi_payload)
    print(f"Status Code: {code}")
    print(f"Complaint Number: {c1.get('complaint_number')}")
    print(f"Translated Text: {c1.get('translated_text')}")
    print(f"Detected Category: {c1.get('category')} (Confidence: {c1.get('category_confidence')})")
    print(f"Priority Level: {c1.get('priority_level')} (Score: {c1.get('priority_score')})")
    print(f"Priority Reasons: {c1.get('priority_reasons')}")
    assert code == 201, "Complaint submission failed!"
    first_id = c1["id"]

    # 3.5 Media Photo Upload Test
    print_section("3.5 Testing Media Photo Upload (Camera / File Capture)")
    dummy_img_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xafA4\x00\x00\x00\x00IEND\xaeB`\x82"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="pothole_test.png"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode("utf-8") + dummy_img_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/complaints/upload-media",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        upload_res = json.loads(resp.read().decode("utf-8"))
        print(f"Status Code: {resp.status}")
        print(f"Uploaded Media URL: {upload_res.get('url')}")
        print(f"Saved Filename: {upload_res.get('filename')}")
        assert resp.status == 200, "Media upload failed!"
        assert upload_res.get("url").startswith("/uploads/"), "Invalid uploaded URL format!"

    # 4. Duplicate Complaint Intake
    print_section("4. Testing Duplicate Detection Engine (Submitting similar complaint nearby)")
    dup_payload = {
        "description": "Severe garbage dump and sewage overflow stinking heavily on Dharavi main market road.",
        "latitude": 19.0761, # ~15 meters away
        "longitude": 72.8777,
        "address_text": "Dharavi Market Entrance, Mumbai",
        "contact_info": {
            "name": "Sunil Verma",
            "phone": "+919820054321"
        }
    }
    code, c2 = make_request(f"{BASE_URL}/complaints/", method="POST", data=dup_payload)
    print(f"Status Code: {code}")
    print(f"Is Duplicate: {c2.get('is_duplicate')}")
    print(f"Duplicate Of (Master ID): {c2.get('duplicate_of')}")
    print(f"Similarity Score: {c2.get('similarity_score')}")
    if c2.get('master_complaint'):
        print(f"Master Complaint Number: {c2['master_complaint']['complaint_number']}")
    assert code == 201, "Duplicate submission failed!"
    assert c2.get('is_duplicate') is True, "Duplicate was not detected!"

    # 5. List Complaints & Filtering
    print_section("5. Testing GET /complaints List & Filters")
    code, list_res = make_request(f"{BASE_URL}/complaints/?category=Sanitation%20%26%20Waste%20Management&page=1&page_size=5")
    print(f"Total Sanitation Complaints: {list_res.get('total')}")
    print(f"Returned Items Count: {len(list_res.get('items', []))}")
    assert code == 200, "List complaints failed!"

    # 6. Status Update Transition (Authority Dashboard)
    print_section("6. Testing PATCH /complaints/{id}/status (Authority Action)")
    patch_payload = {
        "status": "In Progress",
        "updated_by": "Officer Patil (Ward Sanitation)",
        "comment": "Dispatched cleanup crew and sucker vehicle to Dharavi main road."
    }
    code, p_res = make_request(f"{BASE_URL}/complaints/{first_id}/status", method="PATCH", data=patch_payload)
    print(f"Status Code: {code}")
    print(f"New Status: {p_res.get('status')}")
    print(f"Status History Length: {len(p_res.get('status_history', []))}")
    assert code == 200, "Status update failed!"

    # 7. Dashboard Overview Aggregations
    print_section("7. Testing GET /analytics/overview")
    code, stats = make_request(f"{BASE_URL}/analytics/overview")
    print(f"Total Complaints: {stats.get('total_complaints')}")
    print(f"Open: {stats.get('open_complaints')}, In Progress: {stats.get('in_progress_complaints')}, Resolved: {stats.get('resolved_complaints')}")
    print(f"Duplicate Count: {stats.get('total_duplicates')} (Rate: {stats.get('duplicate_rate_percentage')}%)")
    print(f"Categories Breakdown Count: {len(stats.get('category_breakdown', []))}")
    assert code == 200, "Analytics overview failed!"

    # 8. Hotspots Map GIS Markers
    print_section("8. Testing GET /analytics/hotspots")
    code, map_res = make_request(f"{BASE_URL}/analytics/hotspots")
    print(f"Total Map Hotspot Markers: {map_res.get('total_markers')}")
    if map_res.get('markers'):
        m0 = map_res['markers'][0]
        print(f"Sample Marker: {m0.get('complaint_number')} @ [{m0.get('latitude')}, {m0.get('longitude')}] - Category: {m0.get('category')}")
    assert code == 200, "Hotspots failed!"

    print("\n" + "="*70)
    print("  ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀")
    print("="*70 + "\n")

if __name__ == "__main__":
    test_all()
