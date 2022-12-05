import { Input, Button, Space, Card } from "antd";
import React, { useEffect, useState } from "react";

export const APIInput = () => {
  const [apiKey, setAPIKey] = useState("");

  useEffect(() => {
    // Load apiKey from chrome storage
    // @ts-ignore
    chrome.storage.sync.get(["openAIApiKey"], (res) => {
      setAPIKey(res.openAIApiKey);
    });
  }, []);

  return (
    <Card title="GPT3 for slack" bordered={false}>
      <Space direction="horizontal">
        <Input.Password
          placeholder="API key"
          style={{ width: 180 }}
          value={apiKey}
          onChange={(e) => setAPIKey(e.target.value)}
        />
        <Button
          type="primary"
          onClick={() => {
            chrome.storage.sync.set({ openAIApiKey: apiKey });
          }}
        >
          Save
        </Button>
      </Space>
    </Card>
  );
};
