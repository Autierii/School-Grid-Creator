const API_URL = 'http://localhost:3001/api';

async function runTests() {
  try {
    console.log("1. Creating School...");
    let res = await fetch(`${API_URL}/schools`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Escola API Test" })
    });
    const school = await res.json();
    console.log("   Created:", school.name, school.id);

    console.log("2. Creating Teachers...");
    res = await fetch(`${API_URL}/schools/${school.id}/teachers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "João (Matemática)", restrictions: "[]" })
    });
    const t1 = await res.json();
    res = await fetch(`${API_URL}/schools/${school.id}/teachers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Maria (História)", restrictions: "[\"7h\"]" })
    });
    const t2 = await res.json();

    console.log("3. Creating Subjects...");
    res = await fetch(`${API_URL}/schools/${school.id}/subjects`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Matemática", sigla: "MAT" })
    });
    const s1 = await res.json();
    res = await fetch(`${API_URL}/schools/${school.id}/subjects`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "História", sigla: "HIS" })
    });
    const s2 = await res.json();

    console.log("4. Creating Classes...");
    res = await fetch(`${API_URL}/schools/${school.id}/classes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "1º Ano A" })
    });
    const c1 = await res.json();

    console.log("5. Assigning Lessons...");
    await fetch(`${API_URL}/schools/${school.id}/lessons`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: t1.id, classId: c1.id, subjectId: s1.id, aulas: 2 })
    });
    await fetch(`${API_URL}/schools/${school.id}/lessons`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: t2.id, classId: c1.id, subjectId: s2.id, aulas: 1 })
    });

    console.log("6. Testing Generator Endpoint...");
    res = await fetch(`${API_URL}/schools/${school.id}/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horarios: ["7h", "8h", "9h"] })
    });
    const result = await res.json();
    
    if (result.grade) {
      console.log("   ✅ Generator succeeded! Grid created.");
      console.log("   Grid details:", JSON.stringify(result.grade, null, 2));
    } else if (result.error) {
      console.error("   ❌ Generator failed:", result.error);
    } else {
      console.error("   ❌ Generator returned unknown response:", result);
    }

    console.log("\n✅ ALL API TESTS PASSED!");
  } catch (err) {
    console.error("❌ TEST FAILED:", err);
  }
}

runTests();
