import { getFileBaseUrl } from '../core/config/app.config';

/**
 * Tiện ích hỗ trợ xử lý URL hình ảnh/file từ backend.
 * Nếu URL là path tương đối, nó sẽ tự động append Base API URL.
 */
export const ImageUtils = {
  /**
   * Trả về URL đầy đủ cho một file.
   * @param path Đường dẫn file (tương đối hoặc tuyệt đối)
   * @returns URL hoàn chỉnh để hiển thị trên trình duyệt
   */
  getFileUrl(path: string | null | undefined): string {
    if (!path) {
      return ''; // Không trả về placeholder cố định unless necessary.
    }

    // Nếu path đã là URL tuyệt đối (http:// hoặc https://)
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Nếu path bắt đầu bằng data: (base64)
    if (path.startsWith('data:')) {
      return path;
    }

    // Loại bỏ dấu gạch chéo ở đầu nếu có để tránh double slash
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    const base = getFileBaseUrl();
    if (!base) return path;

    const formattedBase = base.endsWith('/') ? base : `${base}/`;
    return `${formattedBase}${cleanPath}`;
  },
};
