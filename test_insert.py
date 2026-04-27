import os

from supabase import Client, create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Missing env vars SUPABASE_URL or SUPABASE_ANON_KEY")
    exit(1)

supabase: Client = create_client(url, key)

try:
    response = supabase.table("friend_follows").insert({
        "follower_id": "test_user_a",
        "followed_id": "test_user_b",
        "followed_name": "Test Name"
    }).execute()
    print("Success:", response)

    # Cleanup
    supabase.table("friend_follows").delete().eq("follower_id", "test_user_a").execute()
except Exception as e:
    print("Error:", e)
