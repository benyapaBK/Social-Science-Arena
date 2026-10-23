import {
  ArrowRight, BarChart3, BookOpen, Building2, Globe2, Handshake, Landmark,
  Play, Puzzle, Sparkles, Target, Timer, Trophy, User, Users
} from 'lucide-react';
import type { GameMode } from '../types';

interface ModeSelectorProps {
  onSelect: (mode: GameMode) => void;
  onOpenHowToPlay?: () => void;
}

const categories = [
  { label: 'ประวัติศาสตร์', Icon: BookOpen },
  { label: 'ภูมิศาสตร์', Icon: Globe2 },
  { label: 'สังคมและวัฒนธรรม', Icon: Users },
  { label: 'หน้าที่พลเมือง', Icon: Landmark }
];

export default function ModeSelector({ onSelect, onOpenHowToPlay }: ModeSelectorProps) {
  return (
    <main
      className="lobby-page"
      style={{ backgroundImage: "linear-gradient(rgba(255, 253, 248, .2), rgba(255, 253, 248, .25)), url('/assets/images/lobby-background.webp')" }}
    >
      <div className="mx-auto max-w-7xl px-3 pb-6 pt-3 sm:px-6 sm:pt-5 lg:px-8">
        <section aria-label="Social-Science Arena" className="lobby-hero">
          <video src="/assets/social-science-lobby.mp4" poster="/assets/lobby-video-poster.webp" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} className="pointer-events-none h-44 w-full object-cover sm:h-56" />
          <div className="lobby-hero-overlay">
            <span className="lobby-hero-badge"><Puzzle size={16} aria-hidden /> PUZZLE LEARNING GAME</span>
            <h1 className="lobby-hero-title">Social-Science <span>Arena</span></h1>
            <p className="lobby-hero-tagline">เปิดภาพ ไขปริศนา เรียนรู้สังคมศึกษาอย่างสนุก</p>
            <div className="lobby-categories" aria-label="หมวดความรู้">
              {categories.map(({ label, Icon }) => (
                <span className="lobby-category" key={label}><Icon size={15} aria-hidden />{label}</span>
              ))}
            </div>
          </div>
        </section>

        <header className="lobby-heading">
          <Puzzle size={30} className="text-mint-deep" aria-hidden />
          <div>
            <h2>เลือกโหมดการผจญภัย</h2>
            <p>เลือกวิธีเล่นที่เหมาะกับคุณ แล้วเริ่มเปิดภาพปริศนาไปด้วยกัน</p>
          </div>
          <Sparkles size={25} className="text-butter-deep" aria-hidden />
        </header>

        <div className="lobby-mode-grid">
          <article className="lobby-mode-card lobby-mode-card--solo">
            <div className="lobby-card-top">
              <span className="lobby-mode-icon lobby-mode-icon--solo"><User size={30} aria-hidden /></span>
              <span className="lobby-mode-label">SOLO MODE</span>
              <span className="lobby-time-badge"><Timer size={16} aria-hidden />ตามชุดเกม</span>
            </div>
            <h3>Solo Player</h3>
            <p className="lobby-mode-thai">Solo Practice หรือ Battle</p>
            <p className="lobby-description">เลือกฝึกเล่นคนเดียวด้วยชุดเกมที่เผยแพร่แล้ว หรือเข้าร่วมการแข่งขัน Battle ด้วยรหัสห้อง</p>
            <div className="lobby-illustration lobby-illustration--solo">
              <img src="/assets/images/solo-player-illustration.webp" alt="ผู้เล่นกำลังสังเกตภาพปริศนาบนแล็ปท็อป" width="1308" height="768" loading="eager" decoding="async" fetchPriority="high" />
            </div>
            <div className="lobby-features">
              <div><Target aria-hidden /><strong>Solo Practice</strong><span>เล่นชุดเกมด้วยตัวเอง</span></div>
              <div><BarChart3 aria-hidden /><strong>Battle</strong><span>แข่งขันผ่านห้องเกม</span></div>
              <div><Trophy aria-hidden /><strong>เลือกเส้นทาง</strong><span>ฝึกฝนหรือท้าทายเพื่อน</span></div>
            </div>
            <button type="button" onClick={() => onSelect('solo')} className="lobby-play-button lobby-play-button--solo">
              <Play size={19} fill="currentColor" aria-hidden />เริ่มเล่นคนเดียว<ArrowRight size={19} aria-hidden />
            </button>
          </article>

          <article className="lobby-mode-card lobby-mode-card--team">
            <div className="lobby-card-top">
              <span className="lobby-mode-icon lobby-mode-icon--team"><Users size={30} aria-hidden /></span>
              <span className="lobby-mode-label">CLASSROOM MODE</span>
              <span className="lobby-time-badge lobby-time-badge--team"><Handshake size={16} aria-hidden />เล่นร่วมกัน</span>
            </div>
            <h3>Teamwork</h3>
            <p className="lobby-mode-thai">เล่นเป็นทีม</p>
            <p className="lobby-description">ครูเลือกชุดเกมแล้วควบคุมกระดานบนจอใหญ่ นักเรียนช่วยกันสังเกตและตอบด้วยวาจา</p>
            <div className="lobby-illustration lobby-illustration--team">
              <img src="/assets/images/teamwork-illustration.webp" alt="เพื่อนสามคนร่วมมือกันดูภาพปริศนาบนแล็ปท็อป" width="1475" height="768" loading="eager" decoding="async" fetchPriority="high" />
            </div>
            <div className="lobby-features">
              <div><Users aria-hidden /><strong>เล่นในห้องเรียน</strong><span>ไม่ต้องให้ผู้เรียนเข้าระบบ</span></div>
              <div><Building2 aria-hidden /><strong>ครูควบคุมเกม</strong><span>เปิดชิ้นและคำใบ้</span></div>
              <div><Trophy aria-hidden /><strong>ช่วยกันตอบ</strong><span>บนกระดานเดียวกัน</span></div>
            </div>
            <button type="button" onClick={() => onSelect('team')} className="lobby-play-button lobby-play-button--team">
              <Users size={20} fill="currentColor" aria-hidden />เริ่ม Teamwork<ArrowRight size={19} aria-hidden />
            </button>
          </article>
        </div>

        <p className="lobby-quote"><span /> <Puzzle size={17} aria-hidden /> เรียนรู้สังคมศึกษา ผ่านเกมที่สนุกและท้าทาย <span /></p>
      </div>

      <footer className="lobby-footer">
        <div className="lobby-footer-main">
          <div className="lobby-footer-brand">
            <img src="/assets/images/social-science-arena-logo.webp" alt="" width="72" height="72" loading="lazy" decoding="async" />
            <div>
              <strong>Social-Science Arena</strong>
              <p>แพลตฟอร์มเกมเปิดภาพปริศนาเพื่อการเรียนรู้สังคมศึกษา ผ่านการเล่น การสังเกต และการร่วมมือกัน</p>
            </div>
          </div>
          <nav className="lobby-footer-links" aria-label="ลิงก์การเล่นเกม">
            <strong>การเล่นเกม</strong>
            <button type="button" onClick={() => onSelect('solo')}>Solo Player</button>
            <button type="button" onClick={() => onSelect('team')}>Teamwork</button>
            {onOpenHowToPlay && <button type="button" onClick={onOpenHowToPlay}>วิธีเล่น</button>}
          </nav>
          <div className="lobby-footer-about">
            <strong>เรียนรู้ไปด้วยกัน</strong>
            <p>สำรวจเรื่องราวทางประวัติศาสตร์ ภูมิศาสตร์ สังคมและวัฒนธรรม ผ่านเกมจิ๊กซอว์เพื่อการเรียนรู้</p>
          </div>
        </div>
        <div className="lobby-footer-bottom">
          <span>© {new Date().getFullYear()} Social-Science Arena</span>
          <span>เรียนรู้สังคมศึกษา ผ่านเกมที่สนุกและการร่วมมือกัน</span>
        </div>
      </footer>
    </main>
  );
}
