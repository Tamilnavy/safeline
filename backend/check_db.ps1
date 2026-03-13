$env:PGPASSWORD='Tamil'
"COMPLAINT 28 CHECK:" | Out-File -FilePath db_out.txt
psql -U postgres -d safeline -c "SELECT id, title, tenant_id FROM complaints WHERE id = 28;" | Out-File -FilePath db_out.txt -Append
"`nUSER 9 CHECK:" | Out-File -FilePath db_out.txt -Append
psql -U postgres -d safeline -c "SELECT id, username, tenant_id FROM users WHERE id = 9;" | Out-File -FilePath db_out.txt -Append
