# TODO

- [ ] Update web case detail card in `web/src/pages/CasesPage.jsx`:
  - [ ] Rename field label `Description` -> `Incident Description`
  - [ ] Add `Suspect Description` block under incident description (left-side card)
- [ ] Fetch suspect description from Firebase by extending Firestore mapping in `web/src/pages/CasesPage.jsx`:
  - [ ] Map `doc.data().suspectDescription` -> `suspectDescription` in `reports` state
- [ ] Run web app and sanity check rendering.

