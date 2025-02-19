import { Injectable } from '@angular/core';
import { deleteDB, IDBPDatabase, openDB } from 'idb';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private idb: Promise<IDBPDatabase>;
  private dbName: string = 'myDatabase';

  constructor() {
    this.idb = openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'key' });
        }
      }
    });
  }

  public getData = async (key: string): Promise<any> => {
    const db = await this.idb;
    return db.transaction('items', 'readonly').objectStore('items').get(key);
  }

  public setData = async (key: string, value: any): Promise<void> => {
    const db = await this.idb;
    const tx = db.transaction('items', 'readwrite');
    const store = tx.objectStore('items');
    await store.put({ key, value });
    await tx.done;
  }

  public deleteDatabase = () => deleteDB(this.dbName);
}
