document.addEventListener("DOMContentLoaded", function () {
  const fillBtn = document.getElementById("fillBtn");

  fillBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const selectedSection = document.getElementById("sectionSelect").value.trim();
    const selectedRating = document.getElementById("ratingSelect").value.trim();

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: autoFillSectionFeedback,
      args: [selectedSection, selectedRating],
    });
  });
});

function autoFillSectionFeedback(selectedSection, selectedRating) {
  const ratingMap = {
    "Strongly Agree": 5,
    "Agree": 4,
    "Neutral": 3,
    "Disagree": 2,
    "Strongly Disagree": 1,
  };

  const ratingValue = ratingMap[selectedRating] || 3;

  const comments = {
    good: "The faculty performed exceptionally well. The sessions were engaging and insightful.",
    neutral: "The overall experience was satisfactory, though there’s room for improvement.",
    bad: "The teaching approach and content delivery need significant improvement.",
  };
  const pickComment = (rating) =>
    rating >= 4 ? comments.good : rating === 3 ? comments.neutral : comments.bad;

  const yesNoClasses = ["data", "data1", "data2"];

  // Handle Yes/No questions for all sections
  if (selectedSection.toLowerCase() === "all") {
    yesNoClasses.forEach((cls) => {
      document.querySelectorAll(`.${cls}`).forEach((row) => {
        const yesRadio = row.querySelector(
          'input[type="radio"][value="1"], input[type="radio"][value="Yes"], input[type="radio"][value="yes"]'
        );
        const noRadio = row.querySelector(
          'input[type="radio"][value="0"], input[type="radio"][value="No"], input[type="radio"][value="no"]'
        );
        if (!yesRadio || !noRadio) return;

        if (ratingValue >= 3 && ratingValue <= 5) {
          yesRadio.checked = true;
          yesRadio.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (ratingValue <= 2) {
          noRadio.checked = true;
          noRadio.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
  }

  // Handle numeric rating inputs for each section
  const panels = document.querySelectorAll(".panel");
  let matched = false;
  panels.forEach((panel) => {
    const title = panel.querySelector(".panel-title a")?.innerText.trim();
    if (
      selectedSection.toLowerCase() === "all" ||
      (title && title.toLowerCase().includes(selectedSection.toLowerCase()))
    ) {
      matched = true;
      const rows = panel.querySelectorAll("table tbody tr");

      rows.forEach((row) => {
        const ratingInputs = row.querySelectorAll('input[type="radio"][name*="Rating"]');
        for (const input of ratingInputs) {
          if (parseInt(input.value) === ratingValue) {
            input.checked = true;
            input.dispatchEvent(new Event("change", { bubbles: true }));
            break;
          }
        }
      });

      // Fill comment for this panel
      const textarea = panel.querySelector("textarea, #FeedbackRating_Comments, textarea[name='FeedbackRating_Comments']");
      if (textarea) {
        textarea.value = pickComment(ratingValue);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  });

  // Fill global comment if all
  if (selectedSection.toLowerCase() === "all") {
    const globalComment = document.querySelector("#FeedbackRating_Comments, textarea[name='FeedbackRating_Comments']");
    if (globalComment) {
      globalComment.value = pickComment(ratingValue);
      globalComment.dispatchEvent(new Event("input", { bubbles: true }));
      globalComment.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}