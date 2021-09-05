const express=require('express')
const app=express()
const body_parser=require('body-parser')
const mongoose=require('mongoose')
const multer=require('multer')
const cors=require('cors')
const morgan=require('morgan')
const cookieParser=require('cookie-parser')
const crypto=require('crypto')
const jwt=require('jsonwebtoken')
const passport=require('passport')
const bcrypt=require('bcrypt')
mongoose.connect("mongodb://localhost/WordCounter",{useNewUrlParser:true,useUnifiedTopology:true});
var fs=require('fs');
app.use(body_parser.urlencoded({extended:true}));
app.use(body_parser.json());
app.set('views','views');
app.set('view engine','ejs');
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser());
var mo=require('method-override');
app.use(mo('_method'));
var path=require('path');

var Schema=mongoose.Schema
 var UserSchema=new Schema({
        fname:{type:String},
        lname:{type:String},
        email:{type:String,required:true,unique:true},
        password:{type:String,required:true,unique:true},
    });
let SALT=10
UserSchema.pre('save',function(next){
    var user=this;
    if(user.isModified('password')){
        bcrypt.genSalt(SALT,function(err,salt){
            if(err){return next(err)}
            bcrypt.hash(user.password,salt,function(err,hash){
                if(err)
                {
                    console.log(err);
                }
                user.password=hash;
                next()
            });
        });
    }else
    {
        next();
    }
});

const Wc=mongoose.model('wc',UserSchema)

var db=mongoose.connection;
db.on('error',console.error.bind(console,'connection error'))
db.once('open',()=>{
    console.log('Connection successful to database')
})
var storage=multer.diskStorage({
    destination:function(req,file,callback){
        callback(null,'./uploadedfiles');
    },
    filename:function(req,file,callback){
    callback(null,file.originalname)
}
});
const uploaded = multer({
    storage:storage
});


app.get('/',function(req,res){
    res.render('home');
});
app.get('/signup',function(req,res){
    res.render('signup',{message:""})
})
app.post('/signup',function(req,res){
    Wc.findOne({email:req.body.email},function(err,found_user){
        if(err){
            console.log(err);
        }
        if(found_user==null){
            var wc=new Wc({ fname:req.body.fname,
                lname:req.body.lname,
                email:req.body.email,
               password:req.body.password})
               wc.save(()=>{
                   console.log('saved')
                   res.render('userhome',{message:"",msg:""});
               });
        }
        else
        {
            res.render('signup',{message:'Email id already exists'});
    }
});
});
app.get('/login',function(req,res){
    res.render('login',{message:""})
})

app.post('/login',function(req,res){
    Wc.findOne({email:req.body.email},function(err,user){
       if(err){
           console.log(err);
       }
       if(!user)
       {
           res.render('login',{message:'invalid credentials'});
       }
       bcrypt.compare(req.body.password,user.password,function(err,Match){
           if(err)
           {
               throw err;
           }
           if(!Match)
           {
               res.render('login',{message:' Invalid credentials'});
           }
           else
           {
               res.render('userhome',{message:"",msg:""});
           }
       });
       });
    });
app.get('/fileupload',function(req,res){
    res.render('fileupload',{message:""}); 
})
app.get('/textbox',function(req,res){
    res.render('userhome',{message:"",msg:""}); 
})
app.post('/upload', function (req, res) {
   
        
    
          
            var count=0;
            var data=req.body.text1;
            
                 var words=data.trim().replace(/\s+|\.|,|\?/g," ").split(" ");
        
                 
    
         for(var i=0;i<words.length;i++)
             {
                 if(words[i])
                     count++;
             }
            
           
            res.render('fileupload',{message:"No of words in uploaded document is "+ count,msg:data});
    
          
        

    
    
});

app.post('/textupload',function(request,response){
   
     var count=0;
            var data=request.body.textinput;
                 var words=data.trim().replace(/\s+|\.|,|\?/g," ").split(" ");
        
                  
    
         for(var i=0;i<words.length;i++)
             {
                 if(words[i])
                     count++;
             }
            
           
            response.render('userhome',{message:"No of words in entered text is "+ count,msg:data});
        });
    


app.get('/reset',function(req,res){
    res.render('reset',{message:""})
})
app.post('/reset',function(req,res){
    Wc.findOne({email:req.body.email},function(err,user){
        if(err)
            {
                console.log(err);
            }
         if(!user)
         {
             res.render('reset',{message:'  Reset Failed! User not found...'})
         }
        else{
            bcrypt.compare(req.body.old_password,user.password,function(err,result){
                if(result){
                    var updated_password=bcrypt.hashSync(req.body.new_password,10);
                    Wc.findOneAndUpdate({email:req.body.email},{$set:{password:updated_password}},{new:true},function(err,user){
                        if(err)
                            {
                                console.log(err);
                            }
                        else{
                            console.log(user);
                           res.render('reset',{message:'Your password has been updated!!'});
                        }
                    });
                }
                else{
                  res.render('reset',{message:" Some error occured! Please try again..."})}
            })
           
        }
    });
});
app.get('/logout',function(req,res){
    res.render('home')
})
app.listen(3000,()=>{
    console.log("Listening to port 3000");
});