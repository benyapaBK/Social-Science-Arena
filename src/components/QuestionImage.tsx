import { useEffect, useState } from 'react';
import { loadImageUrl } from '../services/imageService';

export type ImageState = { url: string; status: 'loading' | 'ready' | 'error' };

export function useQuestionImage(imageFileName: string | undefined): ImageState {
  const [state, setState] = useState<ImageState & { key: string }>({ key: '', url: '', status: 'loading' });
  const key = imageFileName || '';

  useEffect(() => {
    let alive = true;
    if (!key) return;
    loadImageUrl(key)
      .then(url => alive && setState({ key, url, status: 'ready' }))
      .catch(() => alive && setState({ key, url: '', status: 'error' }));
    return () => { alive = false; };
  }, [key]);

  if (!key) return { url: '', status: 'error' };
  if (state.key !== key) return { url: '', status: 'loading' };
  return { url: state.url, status: state.status };
}

export function QuestionImage({ imageFileName, alt, className = '' }: { imageFileName?: string; alt: string; className?: string }) {
  const { url, status } = useQuestionImage(imageFileName);
  const [failedUrl, setFailedUrl] = useState('');
  if (status === 'loading') return <div className={`skeleton ${className}`} role="status" aria-label="กำลังโหลดภาพ" />;
  if (status === 'error' || failedUrl === url) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-cream-deep text-ink-soft ${className}`} role="img" aria-label="ไม่สามารถเปิดภาพได้">
        <span className="text-3xl" aria-hidden>🖼️</span>
        <span className="text-xs font-semibold">ไม่สามารถเปิดภาพได้</span>
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" decoding="async" className={className} onError={() => setFailedUrl(url)} />;
}
