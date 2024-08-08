import {Injectable} from '@angular/core';
import {Actions, ofType, createEffect} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {AppState, selectOrder} from '../../_store';
import * as LoginActions from './auth.action';
import {catchError, exhaustMap, map, take, tap} from 'rxjs/operators';
import {ApiService} from '../../_services/api.service';
import {of} from 'rxjs';
import {Router} from '@angular/router';
import {MatSnackBar, MatSnackBarRef} from '@angular/material/snack-bar';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../../_components/confirm-dialog/confirm-dialog.component';
import {ApiOrderService} from '../../_services/api-order.service';
import {IOrder} from '../../_models/IOrder';
import {StoreService} from '../../_services/store.service';

@Injectable()
export class AuthEffects {

  order: IOrder;
  private snackBarRef: MatSnackBarRef<any>;

  constructor(private store: Store<AppState>,
              private action$: Actions,
              private apiService: ApiService,
              private apiOrderService: ApiOrderService,
              private snackBar: MatSnackBar,
              private dialog: MatDialog,
              private storeService: StoreService,
              private router: Router
  ) {
    this.store.select(selectOrder).subscribe(x => {
      this.order = x;
    });
  }

  login$ = createEffect(() =>
    this.action$.pipe(
      ofType(LoginActions.login),
      exhaustMap(action =>
        this.apiService.login(action.credentials, action.callbackUrl).pipe(
          map(payload => LoginActions.loginSuccess(payload)),
          catchError(error => of(LoginActions.loginFailure(error)))
        ))
    ));

  refreshToken$ = createEffect(() =>
    this.action$.pipe(
      ofType(LoginActions.refreshToken),
      exhaustMap(action => {
          return action.token ?
            this.apiService.refreshToken(action.token).pipe(
              map(payload => LoginActions.refreshTokenSuccess({token: payload.access})),
              catchError(error => of(LoginActions.loginFailure(error)))
            ) :
            of(LoginActions.refreshTokenFailure({
              error: {
                detail: 'Utilisateur non connecté'
              },
              message: 'Utilisateur non connecté',
              name: '',
              status: 401
            }));
        }
      ))
  );

  loginSuccess$ = createEffect(() =>
      this.action$.pipe(
        ofType(LoginActions.loginSuccess),
        tap((payload) => {
          if (this.snackBarRef) {
            this.snackBarRef.dismiss();
          }
          if (!this.order.geom) {
            this.apiOrderService.getLastDraft()
              .pipe(take(1))
              .subscribe(order => {
                if (order) {
                  let dialogRef: MatDialogRef<ConfirmDialogComponent> | null = this.dialog.open(ConfirmDialogComponent, {
                    disableClose: false,
                  });
  
                  dialogRef.componentInstance.noButtonTitle = 'Ignorer';
                  dialogRef.componentInstance.yesButtonTitle = 'Recharger';
                  dialogRef.componentInstance.confirmMessage = `
                    Vous aviez une commande non finalisée dans votre panier la dernière fois que vous vous êtes déconnecté,
                    voulez-vous la recharger?`;
                  dialogRef.afterClosed().subscribe(result => {
                    if (result) {
                      this.storeService.addOrderToStore(order);
                    }
                    this.storeService.IsLastDraftAlreadyLoadedOrChecked = true;
                    dialogRef = null;
                  });
                }
              });
            }
          this.router.navigate([payload.callbackUrl || '/']);
        })
      ), {
      dispatch: false
    }
  );

  loginFailure$ = createEffect(() =>
      this.action$.pipe(
        ofType(LoginActions.loginFailure),
        tap((response) => {
          this.snackBarRef = this.snackBar.open(response.error.detail, 'Ok', {
            panelClass: 'notification-error'
          });
        })
      ), {
      dispatch: false
    }
  );

  logout$ = createEffect(() =>
      this.action$.pipe(
        ofType(LoginActions.logout),
        tap(() => this.router.navigate(['']))
      ), {
      dispatch: false
    }
  );
}
