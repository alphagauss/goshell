import { useMemo, useState } from "react";

export interface CompletionSuggestion {
  type: "command" | "option" | "subcommand" | "path";
  value: string;
  display: string;
  description: string;
}

interface CompletionCommandDefinition {
  description: string;
  options?: string[];
  subcommands?: string[];
}

const BUILTIN_COMMANDS: Record<string, CompletionCommandDefinition> = {
  ls: { description: "列出目录内容", options: ["-l", "-a", "-la", "-lh", "-R"] },
  cd: { description: "切换目录", options: ["..", "~", "-", "/"] },
  cat: { description: "查看文件内容", options: ["-n", "-b", "-s"] },
  grep: { description: "搜索文本", options: ["-r", "-i", "-n", "-v", "-E", "-A", "-B", "-C"] },
  find: { description: "查找文件", options: ["-name", "-type", "-size", "-mtime", "-exec"] },
  git: {
    description: "Git 操作",
    subcommands: ["status", "log", "diff", "branch", "checkout", "commit", "push", "pull", "merge", "stash"],
    options: ["--help", "--version"],
  },
  docker: {
    description: "Docker 管理",
    subcommands: ["run", "ps", "images", "pull", "push", "build", "exec", "logs", "stop", "rm"],
    options: ["-d", "-it", "-p", "-v", "-e", "--name"],
  },
  kubectl: {
    description: "Kubernetes CLI",
    subcommands: ["get", "describe", "create", "apply", "delete", "logs", "exec", "port-forward"],
    options: ["-n", "-o", "-f"],
  },
  systemctl: {
    description: "系统服务管理",
    subcommands: ["start", "stop", "restart", "status", "enable", "disable", "reload"],
    options: ["--no-pager"],
  },
  journalctl: { description: "系统日志", options: ["-u", "-f", "-n", "--since", "--until", "--no-pager"] },
  ps: { description: "进程列表", options: ["-aux", "-ef", "-u", "-p"] },
  top: { description: "进程监控", options: ["-b", "-n", "-p", "-u"] },
  kill: { description: "终止进程", options: ["-9", "-15", "-TERM", "-HUP"] },
  mkdir: { description: "创建目录", options: ["-p", "-v"] },
  touch: { description: "创建空文件", options: ["-a", "-m", "-t"] },
  rm: { description: "删除文件", options: ["-r", "-f", "-i", "-v"] },
  cp: { description: "复制文件", options: ["-r", "-f", "-i", "-v", "-p"] },
  mv: { description: "移动/重命名文件", options: ["-f", "-i", "-v", "-n"] },
  chmod: { description: "修改权限", options: ["-R", "-v"] },
  chown: { description: "修改属主", options: ["-R", "-v"] },
  tar: { description: "打包/解包", options: ["-x", "-c", "-v", "-f", "-z", "-j", "-J", "-t"] },
  zip: { description: "压缩文件", options: ["-r", "-q", "-v"] },
  unzip: { description: "解压文件", options: ["-l", "-o", "-q", "-v"] },
  ssh: { description: "SSH 连接", options: ["-p", "-i", "-L", "-R", "-D", "-N", "-v"] },
  scp: { description: "远程复制", options: ["-r", "-P", "-i", "-q"] },
  rsync: { description: "同步文件", options: ["-a", "-v", "-z", "-r", "-P", "-e"] },
  curl: { description: "HTTP 请求", options: ["-o", "-O", "-L", "-k", "-s", "-S", "-X", "-H", "-d", "-u"] },
  wget: { description: "下载文件", options: ["-O", "-P", "-c", "-q", "-r"] },
  npm: { description: "Node 包管理", subcommands: ["install", "uninstall", "update", "list", "run", "init", "publish", "test", "start", "build"] },
  yarn: { description: "Yarn 包管理", subcommands: ["add", "remove", "install", "run", "init", "publish"] },
  go: { description: "Go 工具", subcommands: ["build", "run", "test", "get", "mod", "fmt", "vet"] },
  python: { description: "Python 解释器", options: ["-c", "-m", "-V"] },
  node: { description: "Node.js 运行时", options: ["-e", "-v"] },
};

const COMMON_PATHS = [
  "~",
  "~/Desktop",
  "~/Documents",
  "~/Downloads",
  "/etc",
  "/var",
  "/var/log",
  "/var/www",
  "/tmp",
  "/opt",
  "/usr",
  "/usr/local",
  "/usr/bin",
  "/home",
  "/root",
  ".",
  "..",
];

export function useCommandCompletion() {
  const [suggestions, setSuggestions] = useState<CompletionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const hasSuggestions = useMemo(() => suggestions.length > 0, [suggestions]);
  const selectedSuggestion = suggestions[selectedIndex] ?? null;

  function getPathCompletions(partial: string) {
    return COMMON_PATHS.filter((path) => path.startsWith(partial)).map<CompletionSuggestion>((path) => ({
      type: "path",
      value: path,
      display: path,
      description: "路径",
    }));
  }

  function getSuggestions(input: string, context: { cwd?: string } = {}) {
    const trimmed = input.trim();
    if (!trimmed) {
      reset();
      return [];
    }

    const parts = trimmed.split(/\s+/);
    const results: CompletionSuggestion[] = [];

    if (parts.length <= 1) {
      const prefix = parts[0] ?? "";
      for (const [command, def] of Object.entries(BUILTIN_COMMANDS)) {
        if (command.startsWith(prefix)) {
          results.push({
            type: "command",
            value: command,
            display: command,
            description: def.description,
          });
        }
      }
    } else {
      const command = parts[0];
      const currentWord = parts[parts.length - 1] ?? "";
      const prevWord = parts[parts.length - 2] ?? "";
      const def = BUILTIN_COMMANDS[command];

      if (def) {
        if (currentWord.startsWith("-")) {
          for (const option of def.options ?? []) {
            if (option.startsWith(currentWord)) {
              results.push({
                type: "option",
                value: option,
                display: option,
                description: "选项",
              });
            }
          }
        } else if (def.subcommands && !currentWord.startsWith("-")) {
          for (const subcommand of def.subcommands) {
            if (subcommand.startsWith(currentWord)) {
              results.push({
                type: "subcommand",
                value: subcommand,
                display: subcommand,
                description: `${command} 子命令`,
              });
            }
          }
        } else if (prevWord && currentWord.startsWith("-") && def.options?.length) {
          for (const option of def.options) {
            if (option.startsWith(currentWord)) {
              results.push({
                type: "option",
                value: option,
                display: option,
                description: `${command} 选项`,
              });
            }
          }
        }
      }

      if (currentWord.startsWith("/") || currentWord.startsWith("~") || currentWord.startsWith(".") || context.cwd) {
        results.push(...getPathCompletions(currentWord));
      }
    }

    const nextSuggestions = results.slice(0, 20);
    setSuggestions(nextSuggestions);
    setSelectedIndex(nextSuggestions.length > 0 ? 0 : 0);
    setIsVisible(nextSuggestions.length > 0);
    return nextSuggestions;
  }

  function applyCompletion(input: string, suggestion: CompletionSuggestion | undefined) {
    if (!suggestion) {
      return input;
    }

    const parts = input.split(/\s+/);
    if (parts.length <= 1) {
      return `${suggestion.value} `;
    }

    parts[parts.length - 1] = suggestion.value;
    const result = parts.join(" ");
    return suggestion.type === "path" && !suggestion.value.endsWith("/") ? result : `${result} `;
  }

  function selectNext() {
    if (suggestions.length === 0) {
      return;
    }
    setSelectedIndex((current) => (current + 1) % suggestions.length);
  }

  function selectPrevious() {
    if (suggestions.length === 0) {
      return;
    }
    setSelectedIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
  }

  function getSelected() {
    return suggestions[selectedIndex] ?? null;
  }

  function hide() {
    setIsVisible(false);
  }

  function show() {
    if (suggestions.length > 0) {
      setIsVisible(true);
    }
  }

  function reset() {
    setSuggestions([]);
    setSelectedIndex(0);
    setIsVisible(false);
  }

  function getCommandHelp(command: string) {
    const def = BUILTIN_COMMANDS[command];
    if (!def) {
      return null;
    }

    return {
      command,
      description: def.description,
      options: def.options ?? [],
      subcommands: def.subcommands ?? [],
    };
  }

  function getAllCommands() {
    return Object.entries(BUILTIN_COMMANDS).map(([command, def]) => ({
      command,
      description: def.description,
    }));
  }

  return {
    suggestions,
    selectedIndex,
    isVisible,
    hasSuggestions,
    selectedSuggestion,
    getSuggestions,
    applyCompletion,
    selectNext,
    selectPrevious,
    getSelected,
    hide,
    show,
    reset,
    getCommandHelp,
    getAllCommands,
  };
}
