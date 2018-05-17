module.exports = (db, descriptor, hooks, callback) => {
    if(!callback) {
        callback = hooks;
        hooks = { onCreate: (callback) => callback() };
    }
    db.query(`CREATE TABLE ${descriptor}`, (error) => {
        if(error && error.code == "42P07") {
            // error `duplicate_table` from postgres ==> already exists ==> all is good
            return callback();
        }
        if(error) {
            return callback(error);
        }
        //no error ==> we just created the table, so we should run onCreate.
        hooks.onCreate(callback);
    });
};
