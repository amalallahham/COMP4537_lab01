(function () {
  const strings = window.MESSAGES  || {};

  const titleEl = document.getElementById("titleText");
  const lastRetrievedLabelEl = document.getElementById("lastRetrievedLabel");
  const notesList = document.getElementById("notesList");
  const placeholder = document.getElementById("placeholder");
  const noNotesTextEl = document.getElementById("noNotesText");

 document.getElementById("backButton").textContent = strings.backButton

  titleEl.textContent = strings.readerTitle 
  noNotesTextEl.textContent = strings.noNotesFound 

  let lastRenderSnapshot = "";

  function getNotes() {
    try {
      return JSON.parse(localStorage.getItem("notes")) || [];
    } catch {
      return [];
    }
  }

  function render() {
    const notes = getNotes();
    const snapshot = JSON.stringify(notes);


    if (snapshot === lastRenderSnapshot) return;
    lastRenderSnapshot = snapshot;

    if (!notes.length) {
      notesList.innerHTML = "";
      placeholder.style.display = "flex";
      return;
    }

    placeholder.style.display = "none";
    notesList.innerHTML = "";

    notes.forEach((note) => {
      const card = document.createElement("div");
      card.className = "card mb-3 shadow-sm";
      card.innerHTML = `
        <div class="card-body d-flex justify-content-between align-items-start">
          <div>
            <p class="card-text mb-2"></p>
            <small class="text-muted">${(strings.savedAt ?? strings.savedAt ?? "Saved at:")} ${note.time ?? "—"}</small>
          </div>
        </div>
      `;
      card.querySelector(".card-text").textContent = note.text ?? "";
      notesList.appendChild(card);
    });
  }

  render();
  setInterval(render, 2000);
  window.addEventListener("storage", (e) => {
    if (e.key === "notes" || e.key === "lastSaved") render();
  });
})();
