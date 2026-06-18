import { Button } from "@/components/ui/button";
import type { AIConfig, AIModelInfo } from "@/types";

export function AIConfigSection({
  connID,
  config,
  models,
  saving,
  loadingModels,
  onChange,
  onSave,
  onFetchModels,
}: {
  connID: string;
  config: AIConfig;
  models: AIModelInfo[];
  saving: boolean;
  loadingModels: boolean;
  onChange: (patch: Partial<AIConfig>) => void;
  onSave: () => void;
  onFetchModels: () => void;
}) {
  return (
    <section className="ai-section">
      <div className="ai-section__heading">
        <div>
          <h3>AI 配置</h3>
          <p>编辑 API、模型与提示词，保存后立即生效。</p>
        </div>
        <Button size="sm" variant="secondary" onClick={onFetchModels} disabled={loadingModels}>
          {loadingModels ? "加载中" : "刷新模型"}
        </Button>
      </div>

      <div className="ai-config-form">
        <label>
          <span>API Endpoint</span>
          <input
            className="input-base"
            value={config.api_endpoint}
            onChange={(event) => onChange({ api_endpoint: event.target.value })}
            placeholder="https://api.openai.com/v1"
          />
        </label>

        <label>
          <span>API Key</span>
          <input
            className="input-base"
            type="password"
            value={config.api_key}
            onChange={(event) => onChange({ api_key: event.target.value })}
            placeholder="sk-..."
          />
        </label>

        <label>
          <span>Model</span>
          <input
            className="input-base"
            value={config.model}
            list={`ai-models-${connID}`}
            onChange={(event) => onChange({ model: event.target.value })}
            placeholder={models.length > 0 ? "从模型列表选择" : "手动输入模型名"}
          />
          <datalist id={`ai-models-${connID}`}>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.owner ? `${model.id} · ${model.owner}` : model.id}
              </option>
            ))}
          </datalist>
        </label>

        <div className="ai-config-form__grid">
          <label>
            <span>Timeout</span>
            <input
              className="input-base"
              type="number"
              min={1}
              value={config.timeout}
              onChange={(event) => onChange({ timeout: Number(event.target.value) || 0 })}
            />
          </label>

          <label>
            <span>Temperature</span>
            <input
              className="input-base"
              type="number"
              min={0}
              step={0.1}
              value={config.temperature}
              onChange={(event) => onChange({ temperature: Number(event.target.value) || 0 })}
            />
          </label>

          <label>
            <span>Max Tokens</span>
            <input
              className="input-base"
              type="number"
              min={1}
              value={config.max_tokens}
              onChange={(event) => onChange({ max_tokens: Number(event.target.value) || 0 })}
            />
          </label>

          <label>
            <span>Top P</span>
            <input
              className="input-base"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={config.top_p ?? 0.95}
              onChange={(event) => onChange({ top_p: Number(event.target.value) || 0 })}
            />
          </label>
        </div>

        <label>
          <span>System Prompt</span>
          <textarea
            className="input-base ai-config-form__prompt"
            value={config.system_prompt}
            onChange={(event) => onChange({ system_prompt: event.target.value })}
            placeholder="输入 AI 系统提示词"
          />
        </label>

        <div className="ai-config-form__actions">
          <Button variant="primary" onClick={onSave} disabled={saving}>
            {saving ? "保存中" : "保存配置"}
          </Button>
        </div>
      </div>
    </section>
  );
}
