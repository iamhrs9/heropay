import React, { useState } from 'react'
import {
  Users,
  UserPlus,
  Link as LinkIcon,
  Copy,
  QrCode,
  ChevronRight,
  ArrowRight,
  Check,
  X,
  Share2
} from 'lucide-react'
import RewardCoin from '../components/RewardCoin'
import HeroPayLogo from '../components/HeroPayLogo'
import { useLockScroll } from '../hooks/useLockScroll'
import './TeamScreen.css'

export default function TeamScreen({ onShareInvite, user }) {
  const [activeTab, setActiveTab] = useState('level1')
  const [copied, setCopied] = useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  // Lock background scroll when modal is open
  useLockScroll(isQrModalOpen || Boolean(selectedMember))

  // Referral URL uses last 6 chars of user's MongoDB _id as their unique code
  const userCode = user?._id?.slice(-6).toUpperCase() || 'XXXXXX'
  const referralUrl = `https://heropay.com/ref/${userCode}`

  // Team members come from backend (referral system) — empty until integrated
  const level1Members = []
  const level2Members = []

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderAvatar = (member) => {
    if (member.avatarType === 'letter') {
      return (
        <div
          className="member-avatar-circle"
          style={{ background: member.avatarBg, color: member.avatarColor }}
        >
          <span>{member.avatarText}</span>
        </div>
      )
    }

    if (member.avatarType === 'avatar1') {
      return (
        <div className="member-avatar-circle avatar-blue">
          <div className="avatar-head" />
          <div className="avatar-body body-blue" />
        </div>
      )
    }

    if (member.avatarType === 'avatar2') {
      return (
        <div className="member-avatar-circle avatar-peach">
          <div className="avatar-head" />
          <div className="avatar-body body-orange" />
        </div>
      )
    }

    return (
      <div className="member-avatar-circle avatar-dark">
        <div className="avatar-head" />
        <div className="avatar-body body-dark" />
      </div>
    )
  }

  return (
    <div className="team-screen-root">
      {/* Header */}
      <header className="team-top-header">
        <div className="team-brand-meta">
          <HeroPayLogo size={36} className="team-brand-logo" />
          <div className="team-brand-text">
            <h1 className="team-brand-title">Team</h1>
            <p className="team-brand-subtitle">Grow Together, Earn Together</p>
          </div>
        </div>

        <button
          type="button"
          className="team-user-plus-btn"
          onClick={() => setIsQrModalOpen(true)}
          aria-label="Invite new member"
        >
          <UserPlus size={19} strokeWidth={2.2} />
        </button>
      </header>

      {/* Hero Card: Your Team */}
      <div className="team-hero-card">
        <div className="team-hero-header">
          <Users size={18} strokeWidth={2.2} className="team-icon" />
          <span className="team-header-title">Your Team</span>
        </div>

        <div className="team-hero-content">
          <div className="team-hero-left">
            <span className="team-members-label">Total Members</span>
            <span className="team-members-count">4</span>

            <div className="team-levels-row">
              <div className="team-level-item">
                <div className="level-dot-wrap">
                  <span className="level-dot dot-l1" />
                </div>
                <div className="level-text-meta">
                  <span className="level-name">Level 1</span>
                  <span className="level-val">4</span>
                </div>
              </div>

              <div className="team-level-item">
                <div className="level-dot-wrap">
                  <span className="level-dot dot-l2" />
                </div>
                <div className="level-text-meta">
                  <span className="level-name">Level 2</span>
                  <span className="level-val">0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="team-hero-right">
            {/* 3D Team Graphic with Crown & Script */}
            <div className="team-3d-art-wrap">
              <div className="team-art-script">Stronger<br />Together</div>
              <div className="team-3d-avatars">
                <div className="art-crown">👑</div>
                <div className="art-bubble b-left" />
                <div className="art-bubble b-mid" />
                <div className="art-bubble b-right" />
              </div>
            </div>

            <button
              type="button"
              className="team-invite-btn"
              onClick={() => setIsQrModalOpen(true)}
            >
              <span>Invite Now</span>
              <ArrowRight size={15} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="team-referral-card">
        <div className="team-referral-header">
          <div className="referral-link-icon-wrap">
            <LinkIcon size={16} strokeWidth={2.4} className="referral-link-icon" />
          </div>
          <span className="referral-header-title">Your Referral Link</span>
        </div>

        <div className="team-referral-input-row">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="team-referral-input"
          />

          <button
            type="button"
            className="team-copy-btn"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check size={14} color="var(--color-success)" strokeWidth={2.6} />
                <span>Copied</span>
              </>
            ) : (
              <span>Copy</span>
            )}
          </button>

          <button
            type="button"
            className="team-qr-btn"
            onClick={() => setIsQrModalOpen(true)}
            aria-label="View QR Code"
          >
            <QrCode size={18} strokeWidth={2.2} />
          </button>
        </div>

        <p className="team-referral-hint">
          Share your link and invite your friends to earn rewards
        </p>
      </div>

      {/* Level Tabs Switcher */}
      <div className="team-level-tabs">
        <button
          type="button"
          className={`team-level-tab ${activeTab === 'level1' ? 'active' : ''}`}
          onClick={() => setActiveTab('level1')}
        >
          Level 1 List (4)
        </button>

        <button
          type="button"
          className={`team-level-tab ${activeTab === 'level2' ? 'active' : ''}`}
          onClick={() => setActiveTab('level2')}
        >
          Level 2 List (0)
        </button>
      </div>

      {/* Team Members List Card */}
      <div className="team-members-container">
        {/* Table Header Row */}
        <div className="team-table-header">
          <span className="col-user">User Info</span>
          <span className="col-commission">His Commission</span>
          <span className="col-reward">My Reward</span>
        </div>

        {/* List Content */}
        {activeTab === 'level1' ? (
          <div className="team-rows-list">
            {level1Members.map((member) => (
              <div
                key={member.id}
                className="team-member-row"
                onClick={() => setSelectedMember(member)}
              >
                {/* User Info */}
                <div className="member-info-col">
                  {renderAvatar(member)}
                  <div className="member-meta">
                    <span className="member-phone">{member.phone}</span>
                    <span className="member-date">{member.date}</span>
                  </div>
                </div>

                {/* His Commission */}
                <div className="member-commission-col">
                  <RewardCoin size={14} />
                  <span className="commission-val">{member.commission.toFixed(2)}</span>
                </div>

                {/* My Reward */}
                <div className="member-reward-col">
                  <div className="reward-value-box">
                    <RewardCoin size={14} />
                    <span className="reward-val">{member.reward.toFixed(2)}</span>
                  </div>
                  <ChevronRight size={16} strokeWidth={2.2} className="member-chevron" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="team-empty-state">
            <p>No Level 2 members yet.</p>
            <span>When your Level 1 referrals invite friends, they will appear here!</span>
          </div>
        )}
      </div>

      {/* Bottom Promo Banner: Invite More, Earn More */}
      <div
        className="team-promo-banner"
        onClick={() => setIsQrModalOpen(true)}
      >
        <div className="team-banner-art">
          <div className="team-banner-chart">
            <div className="chart-step step-1" />
            <div className="chart-step step-2" />
            <div className="chart-step step-3" />
            <div className="chart-arrow-orange">↗</div>
          </div>
        </div>

        <div className="team-banner-text">
          <h4 className="team-banner-title">Invite More, Earn More</h4>
          <p className="team-banner-sub">Build a bigger team and unlock higher rewards</p>
        </div>

        <div className="team-banner-arrow-btn">
          <ChevronRight size={18} strokeWidth={2.4} color="#FF6810" />
        </div>
      </div>

      {/* QR Code & Share Invite Modal */}
      {isQrModalOpen && (
        <div className="team-modal-backdrop" onClick={() => setIsQrModalOpen(false)}>
          <div className="team-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="team-sheet-handle" />
            <div className="team-sheet-header">
              <h3>Invite Friends to HeroPay</h3>
              <button
                type="button"
                className="team-sheet-close"
                onClick={() => setIsQrModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="team-qr-box">
              {/* Stylized QR Code Visual */}
              <div className="qr-code-display">
                <QrCode size={160} strokeWidth={1.8} color="#0F172A" />
                <div className="qr-center-logo">
                  <HeroPayLogo size={22} alt="" />
                </div>
              </div>
              <p className="qr-code-code">Referral Code: <strong>{userCode}</strong></p>
            </div>

            <div className="team-share-actions">
              <button
                type="button"
                className="team-share-btn-primary"
                onClick={handleCopy}
              >
                <Copy size={16} />
                <span>{copied ? 'Link Copied!' : 'Copy Referral Link'}</span>
              </button>

              <button
                type="button"
                className="team-share-btn-whatsapp"
                onClick={() => window.open(`https://api.whatsapp.com/send?text=Join%20HeroPay%20and%20earn%20rewards%20together!%20${referralUrl}`, '_blank')}
              >
                <Share2 size={16} />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="team-modal-backdrop" onClick={() => setSelectedMember(null)}>
          <div className="team-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="team-sheet-handle" />
            <div className="team-sheet-header">
              <h3>Member Details</h3>
              <button
                type="button"
                className="team-sheet-close"
                onClick={() => setSelectedMember(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="member-details-content">
              <div className="details-row">
                <span>Phone</span>
                <strong>{selectedMember.phone}</strong>
              </div>
              <div className="details-row">
                <span>Joined Date</span>
                <strong>{selectedMember.date}</strong>
              </div>
              <div className="details-row">
                <span>His Commission</span>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RewardCoin size={14} /> {selectedMember.commission.toFixed(2)}
                </strong>
              </div>
              <div className="details-row">
                <span>My Reward (Direct Referral)</span>
                <strong style={{ color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RewardCoin size={14} /> {selectedMember.reward.toFixed(2)}
                </strong>
              </div>

              <button
                type="button"
                className="team-share-btn-primary"
                style={{ marginTop: '16px' }}
                onClick={() => setSelectedMember(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
