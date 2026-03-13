$env:PGPASSWORD='Tamil'
$env:PAGER=''
psql -U postgres -d safeline -t -A -c "SELECT r.name FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.username = 'shal_inv';"
