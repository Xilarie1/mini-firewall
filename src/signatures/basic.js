export const signatures = [
  {
    id: "REV_SHELL_PORT",
    description: "Common reverse shell port",
    match: (c) => [4444, 1337, 31337].includes(c.remotePort),
    weight: 40,
  },
  {
    id: "SUSP_POWERSHELL",
    description: "PowerShell outbound traffic",
    match: (c) =>
      c.processName && c.processName.toLowerCase().includes("powershell"),
    weight: 30,
  },
];
