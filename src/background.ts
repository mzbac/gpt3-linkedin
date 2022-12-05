const getConfig = async () => {
  const {
    openAIApiKey,
    model,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
  } = await chrome.storage.sync.get([
    "openAIApiKey",
    "model",
    "temperature",
    "maxTokens",
    "topP",
    "frequencyPenalty",
    "presencePenalty",
  ]);

  return {
    apiKey: openAIApiKey || "",
    model: model || "text-davinci-003",
    temperature: temperature || 0.7,
    maxTokens: maxTokens || 2048,
    topP: topP || 1,
    frequencyPenalty: frequencyPenalty || 1.3,
    presencePenalty: presencePenalty || 1.3,
  };
};

const getNextTokens = async (prompt: string) => {
  const url = "https://api.openai.com/v1/completions";
  try {
    // Get config from storage
    const {
      apiKey,
      model,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
    } = await getConfig();

    // Create request body
    const data = {
      prompt: prompt,
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
    };

    // Create headers
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    };

    // Make request
    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (json.error) {
      return { error: json.error };
    }

    return { text: json.choices[0].text };
  } catch (err) {
    return { error: err };
  }
};

chrome.runtime.onMessage.addListener(async (request) => {
  if (request.text != null) {
    // Communicate with content script to get the current text
    const prompt = request.text;
    const nextTokens = await getNextTokens(prompt);

    // Communicate with content script to update the text
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0]!.id!, { generate: nextTokens });
    });
  }
});
