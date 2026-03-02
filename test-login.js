const http = require('http');

async function testLogin() {
  const getCsrf = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await getCsrf.json();
  const csrfToken = csrfData.csrfToken;
  
  const cookie = getCsrf.headers.get("set-cookie");

  const body = new URLSearchParams();
  body.append('email', 'admin@example.com');
  body.append('password', 'password123');
  body.append('csrfToken', csrfToken);

  const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookie
    },
    body: body.toString(),
    redirect: "manual"
  });

  console.log("Status:", loginRes.status);
  console.log("Headers:", loginRes.headers);
  const text = await loginRes.text();
  console.log("Body length:", text.length, "...")
}
testLogin();
