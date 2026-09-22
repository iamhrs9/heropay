import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Copy,
  ChevronRight,
  ArrowRight,
  Check,
  X,
  Share2,
  Gift,
  ExternalLink,
  MessageSquare
} from 'lucide-react'
import RewardCoin from '../components/RewardCoin'
import HeroPayLogo from '../components/HeroPayLogo'
import { useLockScroll } from '../hooks/useLockScroll'
import './TeamScreen.css'
import { commissionLabel } from '../config'

export default function TeamScreen({ onShareInvite, user }) {
  const [activeTab, setActiveTab] = useState('level1')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  // Team data fetched live from backend
  const [teamData, setTeamData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useLockScroll(Boolean(selectedMember))

  const fetchTeam = useCallback(async () => {
    const token = localStorage.getItem('hp_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const res = await fetch('/api/auth/team', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTeamData(data)
      }
    } catch (err) {
      console.error('Failed to load team data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const userCode = teamData?.referralCode || user?.referralCode || 'HP' + (user?._id?.slice(-6).toUpperCase() || 'HERO')
  const downloadUrl = 'https://tinyurl.com/4bxh52nh'

  const totalMembers = teamData?.totalMembers ?? 0
  const level1Count = teamData?.level1Count ?? 0
  const level2Count = teamData?.level2Count ?? 0
  const level1Members = teamData?.level1Members || []
  const level2Members = teamData?.level2Members || []

  // Readymade catchy invite message
  const shareMessage = `👋 Hello Friend! 
HeroPay app se roz kamao high returns (${commissionLabel} extra yield per order)! 💰

📲 Download App: ${downloadUrl}
🎁 My Referral Code: ${userCode}

Sign up karte waqt mera Referral Code daalo aur turant earning start karo! 🚀`

  const handleCopyCode = () => {
    navigator.clipboard?.writeText?.(userCode)
    setCopiedCode(true)
    onShareInvite?.('Referral code copied!')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(downloadUrl)
    setCopiedLink(true)
    onShareInvite?.('Download link copied!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyFullMessage = () => {
    navigator.clipboard?.writeText?.(shareMessage)
    setCopiedMsg(true)
    onShareInvite?.('Invite message copied!')
    setTimeout(() => setCopiedMsg(false), 2500)
  }

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HeroPay - Earn Daily with HeroPay',
          text: shareMessage,
          url: downloadUrl
        })
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }
    // Fallback to copying full message
    handleCopyFullMessage()
  }

  const renderAvatar = (member) => {
    const initial = (member.name || member.avatarText || 'U')[0].toUpperCase()
    return (
      <div className="member-avatar-circle" style={{ background: 'linear-gradient(135deg, #FF6810, #FF3D00)', color: '#FFFFFF' }}>
        <span>{initial}</span>
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
          onClick={handleNativeShare}
          aria-label="Share invite"
          title="Share referral link"
        >
          <Share2 size={18} strokeWidth={2.2} />
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
            <span className="team-members-count">{totalMembers}</span>

            <div className="team-levels-row">
              <div className="team-level-item">
                <div className="level-dot-wrap">
                  <span className="level-dot dot-l1" />
                </div>
                <div className="level-text-meta">
                  <span className="level-name">Level 1</span>
                  <span className="level-val">{level1Count}</span>
                </div>
              </div>

              <div className="team-level-item">
                <div className="level-dot-wrap">
                  <span className="level-dot dot-l2" />
                </div>
                <div className="level-text-meta">
                  <span className="level-name">Level 2</span>
                  <span className="level-val">{level2Count}</span>
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
              onClick={handleNativeShare}
            >
              <span>Invite Now</span>
              <ArrowRight size={15} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>

      {/* Referral Code & App Link Card */}
      <div className="team-referral-card">
        {/* Row 1: Referral Code display */}
        <div className="team-code-card-header">
          <div className="referral-link-icon-wrap">
            <Gift size={16} strokeWidth={2.4} className="referral-link-icon" />
          </div>
          <div className="team-code-header-text">
            <span className="referral-header-title">Your Referral Code</span>
            <span className="referral-header-sub">Friends enter this code during signup</span>
          </div>
        </div>

        <div className="team-code-display-box">
          <span className="team-code-value">{userCode}</span>
          <button
            type="button"
            className="team-copy-btn team-copy-btn--highlight"
            onClick={handleCopyCode}
          >
            {copiedCode ? (
              <>
                <Check size={14} color="#10B981" strokeWidth={2.6} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Row 2: App Download Link */}
        <div className="team-link-row-label">App Download Link</div>
        <div className="team-referral-input-row">
          <input
            type="text"
            readOnly
            value={downloadUrl}
            className="team-referral-input"
          />

          <button
            type="button"
            className="team-copy-btn"
            onClick={handleCopyLink}
          >
            {copiedLink ? (
              <>
                <Check size={14} color="#10B981" strokeWidth={2.6} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Row 3: Instant Share Buttons */}
        <div className="team-share-btn-grid">
          <button
            type="button"
            className="team-whatsapp-share-btn"
            onClick={handleWhatsAppShare}
          >
            <MessageSquare size={16} />
            <span>Share on WhatsApp</span>
          </button>

          <button
            type="button"
            className="team-full-share-btn"
            onClick={handleNativeShare}
          >
            <Share2 size={16} />
            <span>{copiedMsg ? 'Message Copied!' : 'Share Message'}</span>
          </button>
        </div>

        <p className="team-referral-hint">
          Invite friends to earn 10% lifetime team rewards from their commission!
        </p>
      </div>

      {/* Level Tabs Switcher */}
      <div className="team-level-tabs">
        <button
          type="button"
          className={`team-level-tab ${activeTab === 'level1' ? 'active' : ''}`}
          onClick={() => setActiveTab('level1')}
        >
          Level 1 List ({level1Count})
        </button>

        <button
          type="button"
          className={`team-level-tab ${activeTab === 'level2' ? 'active' : ''}`}
          onClick={() => setActiveTab('level2')}
        >
          Level 2 List ({level2Count})
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
          level1Members.length > 0 ? (
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
                    <span className="commission-val">{Number(member.commission).toFixed(2)}</span>
                  </div>

                  {/* My Reward */}
                  <div className="member-reward-col">
                    <div className="reward-value-box">
                      <RewardCoin size={14} />
                      <span className="reward-val">{Number(member.reward).toFixed(2)}</span>
                    </div>
                    <ChevronRight size={16} strokeWidth={2.2} className="member-chevron" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="team-empty-state">
              <Users size={32} color="#94A3B8" style={{ marginBottom: '8px' }} />
              <p>No Level 1 members yet.</p>
              <span>Share your referral code <strong>{userCode}</strong> with friends to start building your team!</span>
              <button
                type="button"
                className="team-empty-invite-btn"
                onClick={handleNativeShare}
              >
                <Share2 size={14} />
                <span>Invite Friends Now</span>
              </button>
            </div>
          )
        ) : (
          level2Members.length > 0 ? (
            <div className="team-rows-list">
              {level2Members.map((member) => (
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
                    <span className="commission-val">{Number(member.commission).toFixed(2)}</span>
                  </div>

                  {/* My Reward */}
                  <div className="member-reward-col">
                    <div className="reward-value-box">
                      <RewardCoin size={14} />
                      <span className="reward-val">{Number(member.reward).toFixed(2)}</span>
                    </div>
                    <ChevronRight size={16} strokeWidth={2.2} className="member-chevron" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="team-empty-state">
              <Users size={32} color="#94A3B8" style={{ marginBottom: '8px' }} />
              <p>No Level 2 members yet.</p>
              <span>When your Level 1 referrals invite friends, they will automatically appear here!</span>
            </div>
          )
        )}
      </div>

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
                <span>Member Commission</span>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RewardCoin size={14} /> {Number(selectedMember.commission).toFixed(2)}
                </strong>
              </div>
              <div className="details-row">
                <span>My Team Reward</span>
                <strong style={{ color: '#FF5000', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RewardCoin size={14} /> {Number(selectedMember.reward).toFixed(2)}
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
