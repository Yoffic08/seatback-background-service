import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { map, catchError, finalize } from "rxjs/operators";
import { throwError } from 'rxjs/internal/observable/throwError';


declare const cordova: any;
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl = environment.api_host_url;

  constructor(
    private http: HttpClient,
  ) { }
  record(records) {
    const url = this.baseUrl + "/v1.0/ai/record";
    let httpOptions = {
      headers: new HttpHeaders({
        Authorization: "Bearer " + localStorage.getItem("token")
      })
    };
    return this.http.post(url, { records: records }, httpOptions).toPromise();
  }
  login() {
    console.log(environment.production)
    let model = {
      email: "igal@seatback.co",
      password: "io080692"
    }

    if (environment.production) {
      model = {
        email: "adiel@seatback.co",
        password: "Seat20@1"
      }
    }
    return this.http
      .post(this.baseUrl + "/v1.0/auth/login", model)
      .pipe(
        map((response: any) => {
          console.log("login", model);


          if (response.user.auth_token) {
            console.log("Login success");

            localStorage.setItem("tokenUser", JSON.stringify(response.user));
            console.log("user", JSON.parse(localStorage.getItem("tokenUser")));

         

            localStorage.setItem("user_id", response.user.id);
            console.log("user_id", localStorage.getItem("user_id"));

            localStorage.setItem("token", response.user.auth_token);
            console.log("token", localStorage.getItem("token"));

            return response.user;
          }
        })
      )
      .pipe(catchError((err) => this.handleError(err)))
      .pipe(
        finalize(() => {
          console.log("finalize");
        })
      );
  }
  handleError(err) {
    return throwError(err);
  }
}
