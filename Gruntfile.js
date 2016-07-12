module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      both: {
        tasks: ['watch:ts', 'watch:js']
      }
    },
    watch: {
      js: {
        files: ['build/client/**/*.js', 'build/common/**/*.js'],
        tasks: ['browserify:main', 'browserify:worker']
        //tasks: ['exec:main', 'exec:worker']
      },
      ts: {
        files: ['src/**/*.ts'],
        tasks: ['ts']
      }
    },
    browserify: {
      main:{
         src: './build/client/main.js',
         dest: './public/js/mmoo-client.js'
      },

      worker:{
        src: './build/client/worker.js',
        dest: './public/js/mmoo-worker.js'
      }
    },
    ts: {
      default : {
        src: ["src/**/*.ts"],
        outDir: "build",
        options:{
          target: 'es5'
        }
      }
    },
    exec: {
      main: 'browserify -e build/client/main.js -o public/js/mmoo-client.js -t [babelify]',
      worker: 'browserify -e build/client/worker.js -o public/js/mmoo-worker.js -t [babelify]'
    }
  })

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-exec');
  grunt.registerTask('default', ['ts', 'browserify:main', 'browserify:worker', 'concurrent:both']);
  grunt.registerTask('build', ['ts', 'browserify:main', 'browserify:worker']);
  //grunt.registerTask('default', ['ts', 'exec:main', 'exec:worker', 'concurrent:both']);
}
