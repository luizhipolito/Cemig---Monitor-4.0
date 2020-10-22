import { Injectable } from '@angular/core';
import { SQLiteObject, SQLite } from '@ionic-native/sqlite/ngx';
import { BehaviorSubject, Observable } from 'rxjs';
import { Platform } from '@ionic/angular';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { HttpClient } from '@angular/common/http';

export interface Elements {
  id: string;
  Elemento: any[];
  Status: boolean;
  idParent: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataBaseService {
  private database: SQLiteObject;
  private dbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  arvore = new BehaviorSubject([]);

  constructor(
    private plt: Platform,
    private sqlitePorter: SQLitePorter,
    private sqlite: SQLite,
    private http: HttpClient
  ) {
    // this.plt.ready().then(() => {
    //   this.sqlite
    //     .create({
    //       name: 'arvore.db',
    //       location: 'default',
    //     })
    //     .then((db: SQLiteObject) => {
    //       this.database = db;
    //       this.seedDatabase();
    //     });
    // });
  }

  seedDatabase() {
    this.http
      .get('assets/seed.sql', { responseType: 'text' })
      .subscribe((sql) => {
        this.sqlitePorter
          .importSqlToDb(this.database, sql)
          .then((_) => {
            this.loadArvore();
            this.dbReady.next(true);
          })
          .catch((e) => console.error(e));
      });
  }

  getDataBaseState() {
    return this.dbReady.asObservable();
  }

  getArvores(): Observable<Elements[]> {
    return this.arvore.asObservable();
  }

  loadArvore() {
    return this.database.executeSql('Select * FROM arvore', []).then((data) => {
      let arvores: Elements[] = [];

      if (data.rows.length > 0) {
        for (var i = 0; i < data.rows.length; i++) {
          let Elemento = [];
          if (data.rows.item(i).Elemento != '') {
            Elemento = JSON.parse(data.rows.item(i).Elemento);
          }
          arvores.push({
            id: data.rows.item(i).id,
            Elemento: data.rows.item(i).Elemento,
            Status: data.rows.item(i).Status,
            idParent: data.rows.item(i).idParent,
          });
        }
      }
      this.arvore.next(arvores);
    });
  }

  getArvore(id): Promise<Elements> {
    return this.database
      .executeSql('SELECT * FROM WHERE id = ? ', [id])
      .then((data) => {
        let Elemento = [];
        if (data.rows.item(0).Elemento != '') {
          Elemento = JSON.parse(data.rows.item(0).Elemento);
        }
        return {
          id: data.rows.item(0).id,
          Elemento: data.rows.item(0).Elemento,
          Status: data.rows.item(0).Status,
          idParent: data.rows.item(0).idParent,
        };
      });
  }

  getCount(): Promise<number> {
    return this.database
      .executeSql('SELECT COUNT(*) FROM arvore')
      .then((data) => {
        return data.rows;
      });
  }

  insertElemento(id, Elemento, Status, idParent) {
    return this.database.executeSql(
      'INSERT INTO arvore (id, Elemento, Status, idParent) VALUES (?,?,?,?)',
      [id, Elemento, Status, idParent]
    );
  }
}
