import { useRef, useState } from 'react';
import { Button, toast } from '@/shared/components';
import { useAvatarUpload, useCoverUpload } from '../hooks';
import { resolveAssetUrl } from '../services';

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

interface MediaUploadProps {
  avatarUrl: string | null;
  coverPhotoUrl: string | null;
}

export function MediaUpload({ avatarUrl, coverPhotoUrl }: MediaUploadProps) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [previewCover, setPreviewCover] = useState<string | null>(null);

  const avatarUpload = useAvatarUpload();
  const coverUpload = useCoverUpload();

  const validate = (file: File): string | null => {
    if (!ACCEPTED.split(',').includes(file.type)) {
      return 'Only JPEG, PNG and WebP images are supported.';
    }
    if (file.size > MAX_BYTES) {
      return 'Image must be 5 MB or smaller.';
    }
    return null;
  };

  const pickAvatar = (file: File | undefined) => {
    if (!file) return;
    const problem = validate(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    avatarUpload.mutate(file, {
      onSuccess: () => {
        toast.success('Avatar updated');
        setPreviewAvatar(null);
        if (avatarRef.current) avatarRef.current.value = '';
      },
      onError: (error) => {
        toast.error(error.message);
        setPreviewAvatar(null);
      },
    });
  };

  const pickCover = (file: File | undefined) => {
    if (!file) return;
    const problem = validate(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    coverUpload.mutate(file, {
      onSuccess: () => {
        toast.success('Cover photo updated');
        setPreviewCover(null);
        if (coverRef.current) coverRef.current.value = '';
      },
      onError: (error) => {
        toast.error(error.message);
        setPreviewCover(null);
      },
    });
  };

  const currentAvatar = previewAvatar ?? resolveAssetUrl(avatarUrl);
  const currentCover = previewCover ?? resolveAssetUrl(coverPhotoUrl);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Profile picture</h3>
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Current avatar"
            className="mb-3 h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-400">
            No avatar
          </div>
        )}
        <input
          ref={avatarRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPreviewAvatar(URL.createObjectURL(file));
              pickAvatar(file);
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={avatarUpload.isPending}
          onClick={() => avatarRef.current?.click()}
        >
          Upload avatar
        </Button>
        <p className="mt-2 text-xs text-slate-400">JPEG, PNG or WebP up to 5 MB.</p>
      </div>

      <div className="rounded-lg border border-border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Cover photo</h3>
        {currentCover ? (
          <img
            src={currentCover}
            alt="Current cover"
            className="mb-3 h-24 w-full rounded-md object-cover"
          />
        ) : (
          <div className="mb-3 flex h-24 w-full items-center justify-center rounded-md bg-slate-100 text-sm text-slate-400">
            No cover photo
          </div>
        )}
        <input
          ref={coverRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPreviewCover(URL.createObjectURL(file));
              pickCover(file);
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={coverUpload.isPending}
          onClick={() => coverRef.current?.click()}
        >
          Upload cover
        </Button>
        <p className="mt-2 text-xs text-slate-400">JPEG, PNG or WebP up to 5 MB.</p>
      </div>
    </div>
  );
}

export default MediaUpload;
