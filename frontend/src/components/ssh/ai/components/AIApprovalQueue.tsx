import { Button } from "@/components/ui/button";
import type { AIToolApprovalEvent } from "@/lib/wails";

interface ApprovalRequest extends AIToolApprovalEvent {
  createdAt: number;
}

export function AIApprovalQueue({
  approvals,
  onApprove,
  onDeny,
}: {
  approvals: ApprovalRequest[];
  onApprove: (approval: ApprovalRequest) => void;
  onDeny: (approval: ApprovalRequest) => void;
}) {
  return (
    <section className="ai-section">
      <div className="ai-section__heading">
        <div>
          <h3>工具审核</h3>
          <p>AI 发起高风险或需要人工确认的工具调用。</p>
        </div>
        <span className="status-pill">{approvals.length}</span>
      </div>

      {approvals.length === 0 ? (
        <div className="empty-state empty-state--compact">暂无待审核工具调用</div>
      ) : (
        <div className="ai-approval-list">
          {approvals.map((approval) => (
            <article className="ai-approval-card" key={approval.callId}>
              <div className="ai-approval-card__meta">
                <strong>{approval.tool}</strong>
                <span>{approval.callId}</span>
              </div>
              <pre className="ai-approval-card__command">{approval.command}</pre>
              <div className="ai-approval-card__actions">
                <Button size="sm" variant="secondary" onClick={() => onDeny(approval)}>
                  拒绝
                </Button>
                <Button size="sm" variant="primary" onClick={() => onApprove(approval)}>
                  批准
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
