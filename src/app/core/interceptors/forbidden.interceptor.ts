import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { catchError, throwError } from 'rxjs';

export const forbiddenInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NzNotificationService);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 403) {
        notification.error(
          'Không có quyền truy cập',
          'Bạn không có quyền thực hiện hành động này. Vui lòng liên hệ quản trị viên.',
        );
      }
      return throwError(() => error);
    }),
  );
};
