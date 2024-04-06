export interface Config {
  frameworks: Record<string, FrameworkConfig>
  automation: AutomationConfig
}

export interface AutomationConfig {
  steps: Record<string, string>
}

export interface FrameworkConfig {
  outExtension: string
}
