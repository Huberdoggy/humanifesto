(() => {
  const genres = [
    "Action",
    "Adventure",
    "Animation",
    "Comedy",
    "Crime",
    "Documentary",
    "Drama",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "War",
    "Western"
  ];

  const state = {
    primaryGenre: "Action",
    secondaryGenre: "",
    exclude: "",
    mode: "canon",
    seed: ""
  };

  const primarySelect = document.getElementById("primaryGenre");
  const secondarySelect = document.getElementById("secondaryGenre");
  const excludeSelect = document.getElementById("exclude");
  const seedInput = document.getElementById("seed");
  const charCounter = document.getElementById("charCounter");
  const manifestUrlText = document.getElementById("manifestUrlText");
  const installBtn = document.getElementById("installBtn");
  const copyBtn = document.getElementById("copyBtn");
  const resetBtn = document.getElementById("resetBtn");
  const manifestPreview = document.getElementById("manifestPreview");
  const modeSwitch = document.getElementById("modeSwitch");
  const lineupItems = document.getElementById("lineupItems");

  function optionEl(value, label = value) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    return opt;
  }

  function populateSelects() {
    genres.forEach((g) => primarySelect.appendChild(optionEl(g)));

    secondarySelect.appendChild(optionEl("", "None"));
    genres.forEach((g) => secondarySelect.appendChild(optionEl(g)));

    excludeSelect.appendChild(optionEl("", "None"));
    ["Comedy", "Romance", "Animation", "Musical", "Horror"].forEach((g) =>
      excludeSelect.appendChild(optionEl(g))
    );
  }

  function buildManifestUrl() {
    const url = new URL(`${window.location.origin}/manifest.json`);
    if (state.primaryGenre) url.searchParams.set("primaryGenre", state.primaryGenre);
    if (state.secondaryGenre) url.searchParams.set("secondaryGenre", state.secondaryGenre);
    if (state.exclude) url.searchParams.set("exclude", state.exclude);
    if (state.mode) url.searchParams.set("mode", state.mode);
    if (state.seed) url.searchParams.set("seed", state.seed);
    return url.toString();
  }

  function updatePreview() {
    manifestUrlText.textContent = buildManifestUrl();
    charCounter.textContent = `${state.seed.length} / 300`;
  }

  function syncExcludeOptions() {
    const selected = new Set([state.primaryGenre, state.secondaryGenre].filter(Boolean));
    Array.from(excludeSelect.options).forEach((opt) => {
      if (!opt.value) {
        opt.disabled = false;
      } else {
        opt.disabled = selected.has(opt.value);
        if (opt.disabled && opt.value === state.exclude) {
          state.exclude = "";
          excludeSelect.value = "";
        }
      }
    });
  }

  function renderLineup(chips) {
    lineupItems.innerHTML = "";
    if (!chips.length) {
      const empty = document.createElement("div");
      empty.className = "lineup__empty";
      empty.textContent = "Pick your genres to preview a sample lineup.";
      lineupItems.appendChild(empty);
      return;
    }

    const item = document.createElement("div");
    item.className = "lineup__item";
    const chipWrap = document.createElement("div");
    chipWrap.className = "chips";
    chips.forEach((g) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = g;
      chipWrap.appendChild(chip);
    });
    item.appendChild(chipWrap);
    lineupItems.appendChild(item);
  }

  function buildLineup() {
    const chips = [state.primaryGenre, state.secondaryGenre]
      .filter(Boolean)
      .filter((g) => g !== state.exclude);

    const unique = Array.from(new Set(chips)).slice(0, 2);
    renderLineup(unique);
  }

  function setMode(mode) {
    state.mode = mode;
    Array.from(modeSwitch.querySelectorAll(".segmented__option")).forEach((btn) => {
      btn.classList.toggle("segmented__option--active", btn.dataset.mode === mode);
    });
    updatePreview();
  }

  function attachListeners() {
    primarySelect.addEventListener("change", (e) => {
      state.primaryGenre = e.target.value;
      if (state.exclude === state.primaryGenre) {
        state.exclude = "";
        excludeSelect.value = "";
      }
      syncExcludeOptions();
      updatePreview();
      buildLineup();
    });
    secondarySelect.addEventListener("change", (e) => {
      state.secondaryGenre = e.target.value;
      if (state.exclude === state.secondaryGenre) {
        state.exclude = "";
        excludeSelect.value = "";
      }
      syncExcludeOptions();
      updatePreview();
      buildLineup();
    });
    excludeSelect.addEventListener("change", (e) => {
      state.exclude = e.target.value;
      if (state.exclude === state.primaryGenre || state.exclude === state.secondaryGenre) {
        state.exclude = "";
        excludeSelect.value = "";
      }
      syncExcludeOptions();
      updatePreview();
      buildLineup();
    });
    seedInput.addEventListener("input", (e) => {
      state.seed = e.target.value.slice(0, 300);
      if (state.seed !== e.target.value) {
        e.target.value = state.seed;
      }
      updatePreview();
    });

    modeSwitch.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mode]");
      if (btn) {
        setMode(btn.dataset.mode);
      }
    });

    installBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const url = buildManifestUrl();
      const deepLink = `stremio://install-addon?addonUrl=${encodeURIComponent(url)}`;
      // Attempt to trigger Stremio desktop via protocol; fall back to opening the manifest URL.
      window.location.href = deepLink;
      setTimeout(() => {
        window.open(url, "_blank", "noopener");
      }, 350);
      manifestPreview.classList.add("manifest-preview--active");
    });

    copyBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const url = buildManifestUrl();
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy manifest URL"), 1600);
      } catch (err) {
        copyBtn.textContent = "Press Ctrl/Cmd+C";
        manifestUrlText.focus();
      }
      manifestPreview.classList.add("manifest-preview--active");
    });

    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      primarySelect.value = "Action";
      secondarySelect.value = "";
      excludeSelect.value = "";
      seedInput.value = "";
      state.primaryGenre = "Action";
      state.secondaryGenre = "";
      state.exclude = "";
      state.seed = "";
      setMode("canon");
      syncExcludeOptions();
      manifestPreview.classList.remove("manifest-preview--active");
      updatePreview();
      buildLineup();
    });
  }

  function init() {
    populateSelects();
    syncExcludeOptions();
    attachListeners();
    updatePreview();
    buildLineup();
  }

  init();
})();
