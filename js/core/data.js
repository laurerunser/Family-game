// data.js — load and index the five generated content files.
export const DB = {
  people: [], lexicon: [], documents: [], sigils: [], solution: {},
  byPerson: {}, byDoc: {}, byTerm: {}, bySigil: {}, sigilByOwner: {},
};

export async function loadData() {
  const base = 'data/';
  const [people, lexicon, documents, sigils, solution] = await Promise.all(
    ['people', 'lexicon', 'documents', 'sigils', 'solution'].map((n) =>
      fetch(base + n + '.json').then((r) => {
        if (!r.ok) throw new Error('Failed to load ' + n + '.json');
        return r.json();
      })
    )
  );
  DB.people = people; DB.lexicon = lexicon; DB.documents = documents;
  DB.sigils = sigils; DB.solution = solution;
  DB.byPerson = Object.fromEntries(people.map((p) => [p.id, p]));
  DB.byDoc = Object.fromEntries(documents.map((d) => [d.id, d]));
  DB.byTerm = Object.fromEntries(lexicon.map((t) => [t.term_id, t]));
  DB.bySigil = Object.fromEntries(sigils.map((s) => [s.id, s]));
  DB.sigilByOwner = Object.fromEntries(sigils.map((s) => [s.owner_person_id, s]));
  return DB;
}

// term_id -> lexicon entry; also a reverse map from displayed threnne string (lowercased)
export function termByThrenne(text) {
  const q = String(text).trim().toLowerCase();
  return DB.lexicon.find((t) => t.threnne.toLowerCase() === q)
      || DB.lexicon.find((t) => t.threnne.toLowerCase().replace(/[^a-z]/g, '') === q.replace(/[^a-z]/g, ''));
}

export function personName(id) {
  const p = DB.byPerson[id];
  return p ? p.given_name : id;
}
