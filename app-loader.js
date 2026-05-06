(() => {
  const version = "20260506-github-pages-gzip";
  const chunkFiles = [
    "app-data-001.txt",
    "app-data-002.txt",
    "app-data-003.txt",
    "app-data-004.txt",
    "app-data-005.txt",
    "app-data-006.txt",
    "app-data-007.txt",
  ];

  function loadLocalScript() {
    const script = document.createElement("script");
    script.src = `./app.js?v=${version}`;
    script.async = false;
    script.onerror = () => showLoadError(new Error("app.js could not be loaded"));
    document.body.append(script);
  }

  function showLoadError(error) {
    console.error(error);
    const status = document.querySelector("#generationStatus");
    if (status) {
      status.textContent = "アプリの読み込みに失敗しました。ページを再読み込みしてください。";
      status.dataset.tone = "error";
    }
  }

  async function fetchChunk(fileName) {
    const response = await fetch(`./${fileName}?v=${version}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`${fileName}: ${response.status}`);
    return (await response.text()).trim();
  }

  function base64ToBytes(encoded) {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function decodeGzipBase64(encoded) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("This browser does not support DecompressionStream");
    }

    const bytes = base64ToBytes(encoded);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }

  if (window.location.protocol === "file:") {
    loadLocalScript();
    return;
  }

  Promise.all(chunkFiles.map(fetchChunk))
    .then(async (chunks) => {
      const code = await decodeGzipBase64(chunks.join(""));
      const runApp = new Function(code);
      runApp();
    })
    .catch(showLoadError);
})();
