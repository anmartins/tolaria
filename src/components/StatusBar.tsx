import { useState, useRef, useEffect } from 'react'
import { Package, GitBranch, RefreshCw, Sparkles, FileText, Bell, Settings, FolderOpen, Check } from 'lucide-react'

export interface VaultOption {
  label: string
  path: string
}

interface StatusBarProps {
  noteCount: number
  vaultPath: string
  vaults: VaultOption[]
  onSwitchVault: (path: string) => void
}

export function StatusBar({ noteCount, vaultPath, vaults, onSwitchVault }: StatusBarProps) {
  const [showVaultMenu, setShowVaultMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeVault = vaults.find((v) => v.path === vaultPath)

  useEffect(() => {
    if (!showVaultMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowVaultMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showVaultMenu])

  return (
    <footer
      style={{
        height: 30,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--sidebar)',
        borderTop: '1px solid var(--border)',
        padding: '0 8px',
        fontSize: 11,
        color: 'var(--muted-foreground)',
      }}
    >
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <span
            role="button"
            onClick={() => setShowVaultMenu((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: 3,
              background: showVaultMenu ? 'var(--hover)' : 'transparent',
            }}
            title="Switch vault"
          >
            <FolderOpen size={13} />
            {activeVault?.label ?? 'Vault'}
          </span>
          {showVaultMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: 4,
                background: 'var(--sidebar)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: 4,
                minWidth: 160,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 1000,
              }}
            >
              {vaults.map((v) => (
                <div
                  key={v.path}
                  role="button"
                  onClick={() => {
                    onSwitchVault(v.path)
                    setShowVaultMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: v.path === vaultPath ? 'var(--hover)' : 'transparent',
                    color: v.path === vaultPath ? 'var(--foreground)' : 'var(--muted-foreground)',
                    fontSize: 12,
                  }}
                  onMouseEnter={(e) => {
                    if (v.path !== vaultPath) e.currentTarget.style.background = 'var(--hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (v.path !== vaultPath) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {v.path === vaultPath ? <Check size={12} /> : <span style={{ width: 12 }} />}
                  {v.label}
                </div>
              ))}
            </div>
          )}
        </div>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Package size={13} />
          v0.4.2
        </span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <GitBranch size={13} />
          main
        </span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={13} style={{ color: 'var(--accent-green)' }} />
          Synced 2m ago
        </span>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={13} style={{ color: 'var(--accent-purple)' }} />
          Claude Sonnet 4
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <FileText size={13} />
          {noteCount.toLocaleString()} notes
        </span>
        <span
          style={{ display: 'flex', alignItems: 'center', opacity: 0.4, cursor: 'not-allowed' }}
          title="Coming soon"
        >
          <Bell size={14} />
        </span>
        <span
          style={{ display: 'flex', alignItems: 'center', opacity: 0.4, cursor: 'not-allowed' }}
          title="Coming soon"
        >
          <Settings size={14} />
        </span>
      </div>
    </footer>
  )
}
