import { hashString, verifyString } from "./hash";

// Test the functions
async function test() {
  const password = "test123";
  const hash = await hashString(password);
  console.log("Hash:", hash);
  
  const isValid = await verifyString(password, hash);
  console.log("Password valid:", isValid);
}

test().catch(console.error);
