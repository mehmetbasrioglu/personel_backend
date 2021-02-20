// importing


import express from "express";
import sqlite from "sqlite3"
import md5 from "md5"
import cors from "cors"
import path from "path"
import session from "express-session"
import dotenv from "dotenv"
// app config


const app = express();
dotenv.config();
const port = process.env.PORT || 3080
const admin_ps = process.env.ADMIN


app.use(express.json());
app.use(cors(
    {
        origin:["http://localhost:3000"],
        methods:["GET","POST","PATCH","PUT"],
        credentials:true
    }
));

sqlite.verbose();
const _dirname = path.resolve();
app.use("/assets/img",express.static(_dirname + "/assets/img"))
let time = new Date(Date.now() + (30 * 86400 * 1000))
app.use(session({
    key:"userId",
    secret:"backend",
    resave:true,
    saveUninitialized:false,
    cookie: {
        expires: time,
    }
}))

// Veri tabanı adı
let database = new sqlite.Database("personel.sqlite", (err) => {
    if (err){
        console.error(err.message)
      throw err
    }
    else{
        console.log("Connected to database");

        // Personel diye bir tablo yok ise oluştur
        database.run(`CREATE TABLE IF NOT EXISTS sistemgirisleri(
            
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Personel_Adı text,
            Personel_SoyAdı text,
            Email text
            
            )
            `,(err) => {
                if(err){
                    // tablo zaten olusturuldu
                    console.log(err.message)
                }
            })

        database.run(`CREATE TABLE IF NOT EXISTS personel(
            
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Personel_Adı text,
        Personel_SoyAdı text,
        Email text,
        Şifre text,
        Fotoğraf_URL  text,
        Çalıştığı_Konum text,
        Kayitli_mi boolean DEFAULT 0
        
        )
        `,(err) => {
            if(err){
                // tablo zaten olusturuldu
                console.log(err.message)
            }
            else{
                // SQLite veri tabanı oluştuğunda ilk olarak admin kullanıcısını Ekle
          const query = "INSERT INTO personel (Personel_Adı, Personel_SoyAdı, Email, Şifre, Fotoğraf_URL, Çalıştığı_Konum) VALUES (?,?,?,?,?,?)"
          database.run(query,["Admin","Hesabı","admin@admin.com",md5("admin0000"),"https://i.pinimg.com/564x/db/2e/37/db2e3774476e89e7d188d553be4fa640.jpg","Bilgi İşlem"])
            }
        })
    }
})




// api routes 

app.get('/api',(req, res) => {
    res.status(200).send("Başarılı")
})

app.post("/api/personel/sil",(req,res)=>{
    if(!req.query.id){return res.status(400).json({"error":"ID Girilmedi"})}
    const query = "DELETE From personel WHERE id = ?"
    const request = [req.query.id]
    database.run(query,request,(err,rows)=>{
        if(err){
            res.status(400).json({"Error":err})
        }
        res.status(200).send("Başarılı")
    })
})

app.put("/api/personel",(req,res) => {

    if(!req.query.ad){return res.status(400).json({"error":"Personel Adı Girilmedi"})}
    if(!req.query.soyad){return res.status(400).json({"error":"Personel SoyAdı Girilmedi"})}
    if(!req.query.email){return res.status(400).json({"error":"Personel Email Girilmedi"})}
    if(!req.query.sifre){return res.status(400).json({"error":"Personel Şifre Girilmedi"})}
    if(!req.query.konum){return res.status(400).json({"error":"Personel Konu Girilmedi"})}
    if(req.query.ad != "" && req.query.soyad != "" && req.query.email != "" && req.query.sifre != "" && req.query.konum != ""){
        const query = `UPDATE personel SET Personel_Adı = ?,Personel_SoyAdı = ?,Email=?,Şifre=?,Çalıştığı_Konum=? WHERE id = ?`
        const query_data = [req.query.ad,req.query.soyad,req.query.email,req.query.sifre,req.query.konum,req.query.id]
 
        database.run(query,query_data,(err,rows)=>{
            if(err){
                res.status(400).json({"error":err.message})
            }
            res.status(200).json({
                "id": req.query.id,
                "Personel_Adı": req.query.ad,
                "Personel_SoyAdı": req.query.soyad,
                "Email": req.query.email,
                "Şifre": req.query.sifre,
                "Çalıştığı_Konum" : req.query.konum
            })
        })
 
    }
})


app.patch('/api/personel',(req, res) => {
   if(!req.query.ad){return res.status(400).json({"error":"Ad girilmedi"})};
   if(!req.query.soyad){return res.status(400).json({"error":"soyad girilmedi"})};
   if(!req.query.email){return res.status(400).json({"error":"Email girilmedi"})};
   if(!req.query.onay){return res.status(400).json({"error":"Onay girilmedi"})};
   if(req.query.ad != "" && req.query.soyad != "" && req.query.email != "" && req.query.onay == booleanToString(true)){
       const query = `UPDATE personel SET Kayitli_mi = ? WHERE Personel_Adı = ?`
       const query_data = [1,req.query.ad]

       database.run(query,query_data,(err,rows)=>{
           if(err){
               res.status(400).json({"error":err.message})
           }
           res.status(200).json({
               "Personel_Adı": req.query.ad,
               "Personel_SoyAdı": req.query.soyad,
               "Email": req.query.email,
               "Kayitli_mi" : 1
           })
       })

   }
   

   else{
       res.status(400).send("Api isteği başarısız oldu (Error: Sadece personel onaylabilirsiniz örnek kullanım : \n  personel?ad=Personel Adı&soyad=Personel Soyadı&email=Personel Email&onay=true)")
   }
})

const booleanToString = (state) => {
    if (state == true){return 'true'}
    if (state == false){return 'false'}
}


// Personelleri Listeler
app.get('/api/personel',(req,res) => {

    // Ad ve SoyAd göre Listeler
    if ( req.query.ad && req.query.soyad ){
        const query = "SELECT * FROM personel WHERE Personel_Adı LIKE ? and Personel_SoyAdı LIKE ?"
        const request = [req.query.ad,req.query.soyad]
        return database.all(query,request,(err,rows) => {
            if (err){
                res.status(400).json({"error":err.message});
                return;
            }
            res.json(rows)
        })
    }

     //Ad'a göre Listeler
    else if ( req.query.ad && !req.query.soyad){
        const query = "SELECT * FROM personel WHERE Personel_Adı LIKE ?"
        const request = [req.query.ad]
        return database.all(query,request, (err,rows)=>{
            if(err){
                res.status(400).json({"error":err.message})
                return;
            }
            res.json(rows)

        })
    }

    //Personellerin Çalıştığı Konuma Göre Listeler
    else if (req.query.konum){
        const query = "SELECT * FROM personel WHERE Çalıştığı_Konum LIKE ?"
        const request = [req.query.konum]
        return database.all(query,request,(err,rows)=> {
            if (err){
                res.status(400).json(
                    {
                        "error":err.message
                    }
                )
            }
            res.json(rows)
        })
    }

  
    const query = "SELECT *  FROM personel"
    const request = []
    database.all(query,request,(err,rows) => {
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
        res.json(rows)
    })
})


app.get("/api/login",(req,res) => {
    if(req.session.user){
        res.send(req.session.user)
    }
})

app.post("/api/logout",(req,res) => {
    if(req.session.user){
        req.session.destroy();
        res.clearCookie('userId').status(200).send('Ok.');
    }
})

app.post("/api/login",(req,res) => {
    if(!req.query.email) { res.status(400).send({"error":"Email Gerekli"})}
    if(!req.query.sifre){res.status(400).send({"error":"Şifre Gerekli"})}
    const query = "SELECT * FROM personel WHERE Email = ?"
    const request = [req.query.email]
    return database.all(query,request,(err,rows)=> {
        if (err){
            res.status(400).json(
                {
                    "error":err.message
                }
            )
        }
        else{
            rows.forEach((row) => {
                if(req.query.email == row.Email && req.query.sifre == row.Şifre){
                    req.session.user = rows
                    console.log(req.session.user)
                    res.status(200).json(rows)
                    

                }
                else{
                    res.status(400).json({"Error":"Email veya Şifre Uyuşmadı"})
                }
            });
        }
        
        
    })
    
}
);


app.post('/api/personel',(req,res) => {
   // Yeni Personel Ekleme
    if(!req.query.ad){return res.status(400).json({"error":"Personel Adı Girilmedi"})}
    if(!req.query.soyad){return res.status(400).json({"error":"Personel SoyAdı Girilmedi"})}
    if(!req.query.email){return res.status(400).json({"error":"Personel Email Girilmedi"})}
    if(!req.query.sifre){return res.status(400).json({"error":"Personel Şifre Girilmedi"})}
    if(!req.query.konum){return res.status(400).json({"error":"Personel Konum Girilmedi"})}

    else if(req.query.ad != "" && req.query.soyad  != "" && req.query.email  != "" && req.query.sifre  != "" && req.query.konum  != ""){

        const query = "INSERT INTO personel (Personel_Adı, Personel_SoyAdı, Email, Şifre, Fotoğraf_URL, Çalıştığı_Konum) VALUES (?,?,?,?,?,?)"
        var request =[req.query.ad, req.query.soyad, req.query.email, req.query.sifre,"https://i.pinimg.com/564x/57/70/f0/5770f01a32c3c53e90ecda61483ccb08.jpg",req.query.konum]
        database.run(query,request,
        (err,rows)=>{
            if(err){
                res.status(400).json({"error":err.message})
                return;
            }
            res.json({
                    "Personel Adı": req.query.ad,
                    "Personel Soyadı": req.query.soyad,
                    "Email": req.query.email,
                    "Şifre": req.query.sifre,
                    "Çalıştığı Konum": req.query.konum
                }
            )
        })
        
    }
})



// Personellerin her girişinde api sorgula , kaydet ve veritabanında tut.

app.get("/api/personel/join",(req,res) => {
    
    const query = "SELECT * FROM sistemgirisleri"
    var request = []
    database.all(query,request,(err,rows)=>{
        if(err){
            res.status(400).json({"error":err})
        }
        res.json({
            "giris_sayisi":rows.length
        })

    })
    
})

app.post("/api/personel/join",(req,res)=>{
    if(!req.query.ad){return res.status(400).json({"error":"Personel Adı Girilmedi"})}
    if(!req.query.soyad){return res.status(400).json({"error":"Personel SoyAdı Girilmedi"})}
    if(!req.query.email){return res.status(400).json({"error":"Personel Email Girilmedi"})}
    const query = "INSERT INTO sistemgirisleri (Personel_Adı, Personel_SoyAdı, Email) VALUES (?,?,?)"
    var request =[req.query.ad, req.query.soyad, req.query.email]
    database.run(query,request,
    (err,rows)=>{
        if(err){
            res.status(400).json({"error":err.message})
            return;
        }
        res.json({
                "Personel Adı": req.query.ad,
                "Personel Soyadı": req.query.soyad,
                "Email": req.query.email
            }
        )
    })
})




// port listen

app.listen(port,()=> console.log(`Listening on localhost:${port}`))
