// 启用插件
fis.hook('relative');

// 让所有文件，都使用相对路径。
fis.match('**', {
	relative: true
});

var currentMedia = fis.project.currentMedia();
var apiServer = '/renovationhow/';
if (currentMedia === 'dev') {
	apiServer = 'http://pub.bianfengwei.cn/renovationhow/' ;
}
//assets/lib/

fis.match('{/assets/lib/zepto.min.js,/assets/lib/template-web.js,/assets/lib/util.js}', {
	packTo: '/assets/lib/libs.js'
}).match('/assets/lib/zepto.min.js', {
	packOrder: -100
}).match('/assets/lib/template-web.js', {
	packOrder: -50
}).match('/assets/lib/util.js', {
	packOrder: -1
});


fis.match('**.html', {
	parser: fis.plugin('art-template', {
		native: false, //默认为false，即简单语法模式
		openTag: '{{', //默认为{{
		closeTag: '}}',//默认为}}
		compress: false,//默认为false
		define: {
			__layout: '/comm/layout.html',
			apiServer: apiServer,
			'comm/': {
				release: false
			}
		}
	})
});

fis.match('/*.json' , {
	release: false
});

//SCSS Compile
fis.match('*.{html:scss,scss}', {
	parser: fis.plugin('node-sass', {
		outputStyle: 'compact',
		sourceMap: true
	}),
	rExt: '.css'
});

// Global end


// default media is `dev`
fis.media('dev').match('*.{html:js,js}', {
	optimizer: false
}).match('*.{html:css,css}', {
	useSprite: true,
	optimizer: false
}).match('/static/(*)/(**.*)', {
	useHash: false,
	useSprite: false
});

// extends GLOBAL config

// 产品发布，进行合并
fis.media('test').match('*.{html:js,js}', {
	optimizer: fis.plugin('uglify-js', {
		compress: {
			drop_console: true,
			drop_debugger: true
		}
	})
}).match('*.{html:css,css}', {
	useSprite: true,
	optimizer: fis.plugin('clean-css', {
		keepBreaks: true
	})
}).match('/static/(*)/(**.*)', {
	useHash: true,
	useSprite: false
});


// query 
var queryPlaceholder = '?v=';
fis.match('*', {
	query: queryPlaceholder //占位符
}).match('::package', {
	postpackager: [
		fis.plugin('query', {
			placeholder: queryPlaceholder // 这里传入占位符
		}),
		fis.plugin('loader', {
			processor: {
				'.html': 'html'
			}
		})
	]
});


// fis3 server start --root ../dist
// fis3 release test -d ../dist

