export default class Database {
  _isDbOpened = false;

  constructor({ dbName = "testdb", dbVersion = 1 }) {
    this._dbName = dbName;
    this._dbVersion = dbVersion;
    this.initialize();
  }

  async initialize() {
    this._dbRequest = indexedDB.open(this._dbName, this._dbVersion);

    this._dbRequest.onupgradeneeded = function (event) {
      console.log("Upgrade needed!");

      this._db = event.target.result;
      this._db.createObjectStore("photos", {
        keyPath: "id",
      });
    };

    this._dbRequest.onerror = function (event) {
      console.log("Error!");
      console.log(event.target.errorCode);
      this._isDbOpened = false;
    };

    this._dbRequest.onsuccess = (event) => {
      console.log("Success!");

      this._db = event.target.result;
      this._transaction = this._db.transaction("photos", "readonly");
      this._store = this._transaction.objectStore("photos");

      // this._request = this._store.count();
      // const item = {
      //   id: "1",
      //   ruinName: "遺跡名",
      //   photoSrc: "画像ソース",
      // };
      // this._request = this._store.add(item);

      this._request.onsuccess = (event) => {
        this._isDbOpened = true;
      };

      this._request.onerror = function () {
        console.log("カウント関数が機能していません。");
      };
    };
    this._dbRequest.onblocked = function (event) {
      console.log("Blocked!");
      console.log(event.target.result);
    };
  }

  register(item) {
    if (!this._isDbOpened) {
      alert("データベースに問題があります。");
      return;
    }
    this._db = this._dbRequest.result;
    this._transaction = this._db.transaction("photos", "readwrite");
    this._store = this._transaction.objectStore("photos");
    this._request = this._store.add(item);

    this._request.onsuccess = function () {
      alert("データを保存しました。");
    };

    this._request.onerror = function () {
      alert("データを保存できませんでした。");
    };
  }

  getData() {
    return new Promise(async (resolve, reject) => {
      await this._waitForDatabaseOpen();
      this._db = this._dbRequest.result;
      this._transaction = this._db.transaction("photos", "readonly");
      this._store = this._transaction.objectStore("photos");
      this._request = this._store.getAll();
      this._request.onsuccess = (event) => {
        const data = event.target.result;
        if (!data) {
          alert("データがありません");
          reject("データがありません");
          return;
        }
        this.updateData(data);
        resolve(data);
      };
      this._request.onerror = function () {
        console.log("Error");
        reject("データの取得に失敗しました。");
      };
    });
  }

  async _waitForDatabaseOpen() {
    return new Promise((resolve) => {
      const checkDatabaseOpen = () => {
        if (this._isDbOpened) {
          resolve();
        } else {
          setTimeout(checkDatabaseOpen, 100);
        }
      };
      checkDatabaseOpen();
    });
  }

  updateData(data) {
    console.log(data);
  }
}
