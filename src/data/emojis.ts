export interface EmojiAvatar {
  id: string;
  emoji: string;
  name: string;
  category: 'social' | 'thinker' | 'explorer' | 'nature' | 'champion';
  bgGrad: string;
}

export const EMOJI_AVATARS: EmojiAvatar[] = [
  { id: 'av-1', emoji: '🦁', name: 'สิงโตผู้กล้า', category: 'champion', bgGrad: 'from-amber-600 to-yellow-500' },
  { id: 'av-2', emoji: '🦉', name: 'นกฮูกปราชญ์', category: 'thinker', bgGrad: 'from-indigo-600 to-blue-500' },
  { id: 'av-3', emoji: '🦊', name: 'จิ้งจอกปัญญา', category: 'thinker', bgGrad: 'from-orange-600 to-amber-500' },
  { id: 'av-4', emoji: '🐺', name: 'หมาป่าผู้นำ', category: 'champion', bgGrad: 'from-slate-600 to-zinc-500' },
  { id: 'av-5', emoji: '🦅', name: 'อินทรีวิสัยทัศน์', category: 'explorer', bgGrad: 'from-sky-700 to-blue-500' },
  { id: 'av-6', emoji: '🐘', name: 'ช้างมงคลสยาม', category: 'social', bgGrad: 'from-emerald-700 to-teal-500' },
  { id: 'av-7', emoji: '🐅', name: 'เสือสมิงพลัง', category: 'champion', bgGrad: 'from-amber-700 to-orange-500' },
  { id: 'av-8', emoji: '🐬', name: 'โลมานักสื่อสาร', category: 'social', bgGrad: 'from-cyan-600 to-blue-400' },
  { id: 'av-9', emoji: '🐼', name: 'แพนด้าสันติภาพ', category: 'social', bgGrad: 'from-zinc-700 to-slate-500' },
  { id: 'av-10', emoji: '🐨', name: 'โคอาลากัลยาณมิตร', category: 'social', bgGrad: 'from-stone-600 to-zinc-400' },
  { id: 'av-11', emoji: '🦚', name: 'นกยูงวัฒนธรรม', category: 'social', bgGrad: 'from-teal-600 to-emerald-400' },
  { id: 'av-12', emoji: '🐝', name: 'ผึ้งจิตอาสา', category: 'social', bgGrad: 'from-yellow-600 to-amber-400' },
  { id: 'av-13', emoji: '🐢', name: 'เต่าความเพียร', category: 'thinker', bgGrad: 'from-emerald-800 to-green-600' },
  { id: 'av-14', emoji: '🦄', name: 'ยูนิคอร์นความหวัง', category: 'explorer', bgGrad: 'from-purple-600 to-pink-400' },
  { id: 'av-15', emoji: '🐲', name: 'มังกรเกียรติยศ', category: 'champion', bgGrad: 'from-emerald-600 to-green-400' },
  { id: 'av-16', emoji: '🧭', name: 'เข็มทิศชุมชน', category: 'explorer', bgGrad: 'from-blue-700 to-cyan-500' },
  { id: 'av-17', emoji: '🌍', name: 'พลเมืองโลก', category: 'social', bgGrad: 'from-blue-600 to-emerald-500' },
  { id: 'av-18', emoji: '⚖️', name: 'ตาชั่งยุติธรรม', category: 'thinker', bgGrad: 'from-amber-600 to-yellow-600' },
  { id: 'av-19', emoji: '🏛️', name: 'นักรัฐศาสตร์', category: 'thinker', bgGrad: 'from-slate-700 to-stone-500' },
  { id: 'av-20', emoji: '📜', name: 'นักประวัติศาสตร์', category: 'thinker', bgGrad: 'from-amber-800 to-yellow-700' },
  { id: 'av-21', emoji: '🌱', name: 'ต้นกล้าพัฒนา', category: 'nature', bgGrad: 'from-green-600 to-emerald-400' },
  { id: 'av-22', emoji: '🌈', name: 'สายรุ้งเสมอภาค', category: 'social', bgGrad: 'from-rose-500 via-yellow-500 to-cyan-500' },
  { id: 'av-23', emoji: '🤝', name: 'พลังร่วมมือ', category: 'social', bgGrad: 'from-teal-700 to-cyan-600' },
  { id: 'av-24', emoji: '💡', name: 'แสงแห่งนวัตกรรม', category: 'thinker', bgGrad: 'from-yellow-500 to-amber-400' },
  { id: 'av-25', emoji: '🏆', name: 'แชมเปียนอารีน่า', category: 'champion', bgGrad: 'from-yellow-600 to-amber-500' },
  { id: 'av-26', emoji: '🎖️', name: 'เหรียญเชิดชูเกียรติ', category: 'champion', bgGrad: 'from-red-600 to-amber-500' },
  { id: 'av-27', emoji: '👑', name: 'มงกุฎผู้นำวิชาการ', category: 'champion', bgGrad: 'from-amber-500 to-yellow-400' },
  { id: 'av-28', emoji: '🚀', name: 'ยานสู่อนาคต', category: 'explorer', bgGrad: 'from-blue-600 to-violet-500' },
  { id: 'av-29', emoji: '🔭', name: 'กล้องส่องสังคม', category: 'explorer', bgGrad: 'from-indigo-700 to-blue-500' },
  { id: 'av-30', emoji: '🎨', name: 'ศิลปินสังคมศาสตร์', category: 'explorer', bgGrad: 'from-pink-600 to-rose-400' },
  { id: 'av-31', emoji: '🧩', name: 'เซียนจิ๊กซอว์', category: 'thinker', bgGrad: 'from-emerald-500 to-teal-400' },
  { id: 'av-32', emoji: '🎯', name: 'นักคิดตรงเป้า', category: 'champion', bgGrad: 'from-rose-600 to-red-500' },
  { id: 'av-33', emoji: '🕊️', name: 'พิราบสันติภาพ', category: 'social', bgGrad: 'from-sky-400 to-indigo-300' },
  { id: 'av-34', emoji: '🌻', name: 'ทานตะวันพลังบวก', category: 'nature', bgGrad: 'from-yellow-500 to-orange-400' },
  { id: 'av-35', emoji: '💎', name: 'อัญมณีปัญญา', category: 'thinker', bgGrad: 'from-cyan-400 to-blue-600' },
  { id: 'av-36', emoji: '⚡', name: 'สายฟ้าสติปัญญา', category: 'champion', bgGrad: 'from-amber-400 to-yellow-500' },
  { id: 'av-37', emoji: '🌟', name: 'ดาวเด่นสนามแข่ง', category: 'champion', bgGrad: 'from-yellow-400 to-amber-300' },
  { id: 'av-38', emoji: '📚', name: 'คลังความรู้สังคม', category: 'thinker', bgGrad: 'from-violet-700 to-purple-500' },
  { id: 'av-39', emoji: '🛡️', name: 'โล่พิทักษ์สิทธิ', category: 'social', bgGrad: 'from-emerald-700 to-teal-600' },
  { id: 'av-40', emoji: '🔥', name: 'ไฟแห่งความกระตือรือร้น', category: 'champion', bgGrad: 'from-orange-600 to-red-500' }
];
