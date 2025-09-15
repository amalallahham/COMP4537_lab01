document.addEventListener("DOMContentLoaded", () => {
  const s = window.MESSAGES || {};

  if (s.indexTitle) document.title = s.indexTitle;
  if (s.indexHeading) document.getElementById("indexHeading").textContent = s.indexHeading;
  if (s.indexReader) document.getElementById("indexReader").textContent = s.indexReader;
  if (s.indexWriter) document.getElementById("indexWriter").textContent = s.indexWriter;
});
