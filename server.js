const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient
const bodyParser= require('body-parser')
const {ObjectId} = require('mongodb');
app.use(bodyParser.urlencoded({extended: true})) 
app.use('/public' , express.static('public'));
app.set('view engine','ejs')

const methodOverride = require('method-override')
app.use(methodOverride('_method'))

const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);


var fs = require('fs');
var db;
 
MongoClient.connect('mongodb+srv://test:test@cluster0.4vzz4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(err,result){
    
    if(err){
        return console.log(err)
    }
    db = result.db('todoapp');

    //db.collection('post').insertOne({이름 : 'john',나이 :20,_id:100},function(req,res){

   // }); 
   

    http.listen(8080,function(){
        console.log('test on 8080')
    });
});

app.get('/beauty',function(req,res){
    res.send("req_send_beauty");
});

app.get('/',function(req,res){
    res.render('index.ejs',{});
});

app.get('/write',function(req,res){
    res.render('write.ejs',{});
});

 
app.get('/list',function(req,res){
   db.collection('post').find().toArray(function (err,result){
        res.render('list.ejs',{posts : result});
   });
});



 app.get('/detail/:id',function(req,res){
 
    db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(err, result){
    
        if(result== null ){ 
       
            res.sendFile(__dirname+'/error.html');
        }
        else
        { 
            res.render('detail.ejs',{data : result});
        }
   });

});

 app.get('/edit/:id',function(req,res){
 
     db.collection('post').findOne({ _id : parseInt(req.params.id) }, function(err, result){
    
        if(result == null){ 
            res.sendFile(__dirname+'/error.html');
        }
        else
        { 
            res.render("edit.ejs",{post:result});
        }
      
     });
 })

 app.put('/edit',function(req,res){
    db.collection('post').updateOne({_id : parseInt(req.body.id) },{$set:{제목 : req.body.title , 날짜:req.body.date}},function(err,result){
            console.log('수완')
            res.redirect('/list')
    })
 });

  
 const passport = require('passport');
 const passportlocal = require('passport-local').Strategy;
 const session = require('express-session');
 
 app.use(session({secret :'비밀코드', resave : true,saveUninitialized:false}))
 app.use(passport.initialize());
 app.use(passport.session());

 app.get('/login',function(req,res){
    res.render("login.ejs")
});
app.get('/error',function(req,res){
    res.sendFile(__dirname+'/error.html');
});

app.post('/login',passport.authenticate('local', {failureRedirect:'/error'}), function(req,res){
    res.redirect('/')
});
 
passport.use(new passportlocal({    usernameField: 'id',    passwordField: 'pw',    session: true,    passReqToCallback: false,  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));

  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });
  
  passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({ id : 아이디 }, function(err, result){
        done(null, result)
    }); 
  }); 

  app.post('/register', function(req,res){
        db.collection('login').findOne({ id : req.body.id }, function(err, result){
            if(result==null){
                db.collection('login').insertOne({ id : req.body.id, pw : req.body.pw }, function(err, result){
                    res.redirect('/');
                });
            }else{
                res.send('아이디있음')
            }
        }); 
    });

    app.post('/add',function(req,res){
        res.send("req_send_add");
        db.collection('counter').findOne({name:'개시물갯수'},function(err,result){
             var TotalPostcnt =  result.totalPost;
             var sneddata ={제목 : req.body.title,날짜 :req.body.date, _id:TotalPostcnt+1,작성자 :req.user._id}
             db.collection('post').insertOne(sneddata,function(req,res){
         
                db.collection('counter').updateOne( {name:'개시물갯수'} ,{ $inc: {totalPost:1} }, function(에러, 결과){
                    
                    console.log('수정완료')
                });
     
            });   
        });
    });
    app.delete('/delete',function(req,res){
        req.body._id = parseInt(req.body._id)
        
    
        var isdel={_id:req.body._id,작성자:req.user._id}  
        db.collection('post').deleteOne(isdel, function(err, result){
            if(result)console.log(result)
            res.status(200).send({message:'succeed'});
            //res.status(400).send({message:'fail'});
          })
     });
  app.get('/mypage', islogin, function(req,res){
    res.render('mypage.ejs' , {test : req.user}) 
  });

function islogin(req,res,next){
    if(req.user){
        next()
    }else{
        res.send('로그인안함')
    }
}

app.get('/search', (req,res)=>{
   // db.collection('post').find({ 제목 : req.query.value }).toArray(function (err,result){
    //db.collection('post').find( {$text: { $search:req.query.value } } ).toArray(function (err,result){  
    //res.render('search.ejs',{posts : result});
   //});
var condition=[  {
    $search: {
      index: 'titleSearch',
      text: {
        query: req.query.value,
        path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
      }
    }
  },
//  {$sort : {_id :1}},
 // {$limit : 10 },
 // { $project : { 제목 : 1, _id : 1 ,score:{$meta:"searchScore"}} }
]
     db.collection('post').aggregate( condition ).toArray(function (err,result){ 
         console.log(result) 
    res.render('search.ejs',{posts : result});
   });
  })

 
 
app.use('/shop',require('./routes/shop.js'));
app.use('/board/sub',require('./routes/board.js'));


let multer = require('multer');
var storage = multer.diskStorage({

  destination : function(req, file, cb){
    cb(null, './public/storage')
  },
  filename : function(req, file, cb){
    cb(null, file.originalname )
  },
  filefilter : function(req, file, cb){
  },


});
var upload = multer({storage : storage});

app.get('/upload',function(req,res){
    res.render('upload.ejs')
})

//app.post('/upload',upload.array('profile',10),function(req,res)
app.post('/upload',upload.single('profile'),function(req,res){
    res.send('완료')
})

app.get('/image/:filename',function(req,res){
    res.sendFile(__dirname+'/public/img/'+req.params.filename)
})
var dir = './public/img/';

app.get('/showimg',function(req,res){
    var files = fs.readdirSync(dir);
var result=[];
    for(var i = 0; i < files.length; i++){
        var file = files[i];
 
   
      
        // 확장자가 json일 경우 읽어 내용 출력
        console.log(__dirname+'/public/img/'+file)
        result[i]='./public/img/'+file;
 
    }
    res.render('showimg.ejs',{posts : result});
})

app.post('/chatroom',islogin,function(req,res){
    console.log("11111")
console.log(req.user._id)
    var savedata ={
        title : 'test',
        member : [ObjectId(req.body.ownerid),req.user._id],
        date : new Date()
    }
db.collection('chat').insertOne(savedata).then((result)=>{
    res.send('성공')
});

});
app.get('/chat',islogin,function(req,res){
    db.collection('chat').find({member : req.user._id}).toArray().then((result)=>{
        res.render('chat.ejs',{data :result})
    })
 
});

app.post('/message',islogin,function(req,res){
    var send_data = {
        parent : req.body.parent,
        content : req.body.content,
        userid : req.user._id,
        date : new Date(),
    }
    db.collection('message').insertOne(send_data, function(err, result){
        console.log(send_data)
    });
 
});


app.get('/message/:id', islogin, function(req,res){

    res.writeHead(200, {
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });

    db.collection('message').find({parent :req.params.id }).toArray()
    .then((result)=>{
        res.write('event: test\n');
        res.write('data: '+JSON.stringify(result)+'\n\n');
    })

    const pipeline = [
        { $match: { 'fullDocument.parent': req.params.id} }
      ];
    
      const changeStream = db.collection('message').watch(pipeline);
      changeStream.on('change', result => {
        console.log(result.fullDocument);
        var addresult = [result.fullDocument];
        res.write('event: test\n');
        res.write('data: '+JSON.stringify(addresult)+'\n\n');
 
      });
  
  });
app.get('/socket',function(req,res){
        res.render('socket.ejs')
});

io.on('connection', function(socket){
    console.log('연결되었어요');

    socket.on('room2-send' , function(data){
        io.to('room2').emit('broadcast',data)
    })

    socket.on('room1-send' , function(data){
        io.to('room1').emit('broadcast',data)
    })
    socket.on('joinroom' , function(data){
    if(data=='1'){
        socket.join('room1');
    }
    else{
        socket.join('room2');
    }

      
    })
    socket.on('user-send' , function(data){
        console.log(data);  
        io.emit('broadcast',data)
        //io.to(socket.id).emit('broadcast',data)
    });
 
});
