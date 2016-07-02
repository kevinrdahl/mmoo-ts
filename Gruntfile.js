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
        target: ['es6'],
        src: ["src/**/*.ts"],
        outDir: "build"
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.registerTask('default', ['ts', 'browserify:main', 'browserify:worker', 'concurrent:both']);
}
