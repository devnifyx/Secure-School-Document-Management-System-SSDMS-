import React, { useEffect, useState } from 'react';
import api from '../services/api';

// Photos need the auth header, so they are fetched as blobs and cached per user.
// `version` (the user's updated_at) busts the cache when the photo changes.
const urlCache = new Map<number, { version: string; url: string }>();
const inflight = new Map<string, Promise<string | null>>();

const loadPhoto = (userId: number, version: string): Promise<string | null> => {
    const cached = urlCache.get(userId);
    if (cached && cached.version === version) return Promise.resolve(cached.url);

    const key = `${userId}:${version}`;
    const pending = inflight.get(key);
    if (pending) return pending;

    const request = api
        .get(`/users/${userId}/photo`, { responseType: 'blob' })
        .then((res) => {
            const url = URL.createObjectURL(res.data);
            urlCache.set(userId, { version, url });
            return url;
        })
        .catch(() => null)
        .finally(() => inflight.delete(key));

    inflight.set(key, request);
    return request;
};

interface UserAvatarProps {
    userId: number;
    name: string;
    hasPhoto?: boolean;
    version?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ userId, name, hasPhoto, version, className, style }) => {
    const ver = String(version ?? '');
    const cachedNow = urlCache.get(userId);
    const [src, setSrc] = useState<string | null>(hasPhoto && cachedNow?.version === ver ? cachedNow.url : null);

    useEffect(() => {
        if (!hasPhoto) {
            setSrc(null);
            return;
        }
        let active = true;
        loadPhoto(userId, ver).then((url) => {
            if (active) setSrc(url);
        });
        return () => {
            active = false;
        };
    }, [userId, hasPhoto, ver]);

    return (
        <div className={className} style={{ overflow: 'hidden', ...style }}>
            {src ? (
                <img
                    src={src}
                    alt={name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
            ) : (
                name.charAt(0).toUpperCase() || 'U'
            )}
        </div>
    );
};

export default UserAvatar;
