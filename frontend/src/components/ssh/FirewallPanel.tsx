import { useEffect, useState } from "react";
import { Flame, Plus, RefreshCcw, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { StatusLine } from "@/components/StatusLine";
import { extractErrorMessage } from "@/lib/errors";
import { firewallApi, type FirewallInfo, type FirewallRule } from "@/lib/wails";

interface FirewallRuleFormState {
  scope: string;
  target: string;
  protocol: string;
  port: string;
  source: string;
  comment: string;
}

function createDefaultRuleForm(type?: string): FirewallRuleFormState {
  if (type === "firewalld") {
    return {
      scope: "public",
      target: "allow",
      protocol: "tcp",
      port: "",
      source: "",
      comment: "",
    };
  }

  if (type === "ufw") {
    return {
      scope: "INPUT",
      target: "allow",
      protocol: "tcp",
      port: "",
      source: "Anywhere",
      comment: "",
    };
  }

  return {
    scope: "INPUT",
    target: "ACCEPT",
    protocol: "tcp",
    port: "",
    source: "0.0.0.0/0",
    comment: "",
  };
}

function getFirewallSummary(info: FirewallInfo | null) {
  return [
    `类型 ${info?.type || "unknown"}`,
    `状态 ${info?.status || "unknown"}`,
    `规则 ${info?.rules?.length ?? 0}`,
  ].join(" · ");
}

function getToggleTarget(info: FirewallInfo | null) {
  if (info?.status === "active") {
    return { enable: false, label: "停用防火墙" };
  }
  return { enable: true, label: "启用防火墙" };
}

function getRuleTitle(rule: FirewallRule) {
  return [rule.chain, rule.target, rule.protocol, rule.port].filter(Boolean).join(" ");
}

function formatRuleLocation(info: FirewallInfo | null, scope: string) {
  if (info?.type === "firewalld") {
    return scope || "public";
  }
  return scope || "INPUT";
}

export function FirewallPanel({ connID }: { connID: string }) {
  const [info, setInfo] = useState<FirewallInfo | null>(null);
  const [ruleForm, setRuleForm] = useState<FirewallRuleFormState>(() => createDefaultRuleForm());
  const [command, setCommand] = useState("sudo ufw status numbered");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const nextInfo = await firewallApi.GetFirewallInfo(connID);
      setInfo(nextInfo ?? null);
      setStatus("");
    } catch (err) {
      setStatus(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function toggleFirewall() {
    const toggle = getToggleTarget(info);
    const confirmed = await confirm({
      title: toggle.label,
      description: toggle.enable ? "确认启用防火墙？" : "确认停用防火墙？",
      confirmText: toggle.label,
      cancelText: "取消",
      danger: !toggle.enable,
    });
    if (!confirmed) {
      return;
    }

    setStatus("");
    try {
      await firewallApi.ToggleFirewall(connID, toggle.enable);
      toast.success(toggle.label, getFirewallSummary(info));
      await load();
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error(toggle.label, message);
    }
  }

  async function addRule() {
    const port = ruleForm.port.trim();
    const scope = formatRuleLocation(info, ruleForm.scope.trim());
    const target = ruleForm.target.trim() || (info?.type === "iptables" ? "ACCEPT" : "allow");
    const protocol = ruleForm.protocol.trim() || "tcp";
    const source = ruleForm.source.trim();
    const comment = ruleForm.comment.trim();

    if (!port) {
      setStatus("请输入端口或服务名");
      return;
    }

    setStatus("");
    try {
      await firewallApi.AddRule(connID, scope, target, protocol, port, source, comment);
      toast.success("防火墙规则已添加", `${scope} ${port}`);
      setRuleForm(createDefaultRuleForm(info?.type));
      await load();
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("添加防火墙规则", message);
    }
  }

  async function deleteRule(rule: FirewallRule) {
    const confirmed = await confirm({
      title: "删除防火墙规则",
      description: `确定删除规则 ${getRuleTitle(rule)} 吗？`,
      confirmText: "删除",
      cancelText: "取消",
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    setStatus("");
    try {
      await firewallApi.DeleteRule(connID, rule.chain, rule.index, rule.port, rule.protocol);
      toast.info("防火墙规则已删除", getRuleTitle(rule));
      await load();
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("删除防火墙规则", message);
    }
  }

  async function runCustomCommand() {
    setStatus("");
    try {
      setOutput(String(await firewallApi.RunCustomCommand(connID, command)));
      await load();
    } catch (err) {
      const message = extractErrorMessage(err);
      setStatus(message);
      toast.error("执行防火墙命令", message);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [connID]);

  useEffect(() => {
    setRuleForm((current) => {
      if (info?.type === "firewalld" && current.scope === "INPUT") {
        return { ...current, scope: "public", target: "allow" };
      }
      if (info?.type === "ufw" && current.scope === "public") {
        return { ...current, scope: "INPUT", target: "allow" };
      }
      if (info?.type === "iptables" && current.scope === "public") {
        return { ...current, scope: "INPUT", target: "ACCEPT" };
      }
      return current;
    });
  }, [info?.type]);

  return (
    <section className="tool-panel ssh-panel firewall-panel">
      <div className="panel-heading">
        <h2>防火墙</h2>
        <div className="firewall-panel__actions">
          <Button variant="secondary" size="sm" onClick={() => void toggleFirewall()} disabled={loading || !info}>
            <Shield size={14} />
            {getToggleTarget(info).label}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="刷新" disabled={loading}>
            <RefreshCcw size={15} className={loading ? "is-spinning" : ""} />
          </Button>
        </div>
      </div>

      <div className="firewall-summary">
        <span className="status-pill">{info?.type || "unknown"}</span>
        <span className={`status-pill ${info?.status === "active" ? "status-pill--success" : ""}`}>
          {info?.status || "unknown"}
        </span>
        <span className="status-pill">{info?.chains?.length ? info.chains.join(", ") : "无链"}</span>
        <span className="status-pill">{info?.rules?.length ?? 0} 条规则</span>
      </div>

      <StatusLine tone="danger">{status}</StatusLine>

      <div className="firewall-rule-form">
        <div className="firewall-rule-form__heading">
          <h3>添加规则</h3>
          <span>iptables / firewalld / ufw</span>
        </div>
        <div className="firewall-form">
          <input
            className="input-base"
            value={ruleForm.scope}
            onChange={(event) => setRuleForm((current) => ({ ...current, scope: event.target.value }))}
            placeholder={info?.type === "firewalld" ? "zone" : "chain"}
          />
          <select
            className="input-base"
            value={ruleForm.target}
            onChange={(event) => setRuleForm((current) => ({ ...current, target: event.target.value }))}
          >
            <option value="ACCEPT">ACCEPT</option>
            <option value="DROP">DROP</option>
            <option value="REJECT">REJECT</option>
            <option value="allow">allow</option>
            <option value="deny">deny</option>
          </select>
          <input
            className="input-base"
            value={ruleForm.protocol}
            onChange={(event) => setRuleForm((current) => ({ ...current, protocol: event.target.value }))}
            placeholder="tcp / udp"
          />
          <input
            className="input-base"
            value={ruleForm.port}
            onChange={(event) => setRuleForm((current) => ({ ...current, port: event.target.value }))}
            placeholder="端口或服务名"
          />
          <input
            className="input-base"
            value={ruleForm.source}
            onChange={(event) => setRuleForm((current) => ({ ...current, source: event.target.value }))}
            placeholder="来源地址"
          />
          <input
            className="input-base"
            value={ruleForm.comment}
            onChange={(event) => setRuleForm((current) => ({ ...current, comment: event.target.value }))}
            placeholder="备注"
          />
          <Button variant="primary" size="sm" onClick={() => void addRule()} disabled={loading}>
            <Plus size={14} />
            添加
          </Button>
        </div>
      </div>

      <div className="firewall-rule-list">
        <div className="firewall-rule-list__heading">
          <h3>规则列表</h3>
          <span>{info?.rules?.length ?? 0} 条</span>
        </div>

        {info?.rules?.length ? (
          info.rules.map((rule) => (
            <article className="firewall-rule-row" key={`${rule.chain}-${rule.index}-${rule.port}-${rule.protocol}`}>
              <span>{rule.index}</span>
              <span>{rule.chain || "-"}</span>
              <span>{rule.target || "-"}</span>
              <span>{rule.protocol || "-"}</span>
              <span>{rule.source || "-"}</span>
              <span>{rule.dest || "-"}</span>
              <span>{rule.port || "-"}</span>
              <span>{rule.comment || rule.raw || "-"}</span>
              <div className="row-actions firewall-rule-row__actions">
                <Button size="sm" variant="danger" onClick={() => void deleteRule(rule)}>
                  <Trash2 size={14} />
                  删除
                </Button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state empty-state--compact">暂无规则</div>
        )}
      </div>

      <div className="firewall-custom-command">
        <div className="firewall-custom-command__heading">
          <h3>自定义命令</h3>
          <span>仅允许防火墙相关命令</span>
        </div>
        <textarea
          className="input-base command-input"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
        />
        <div className="panel-actions">
          <Button variant="primary" onClick={() => void runCustomCommand()}>
            <Flame size={15} />
            执行
          </Button>
        </div>
        <pre className="command-output">{output || info?.rawOutput || JSON.stringify(info, null, 2)}</pre>
      </div>
    </section>
  );
}
