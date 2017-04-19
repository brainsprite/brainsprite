#!/bin/bash
for name in 'basic' 'overlay'; do
  ~/node_modules/casperjs/bin/casperjs test casper_test_load_no_error.js --log-level=debug --name=$name
done 
