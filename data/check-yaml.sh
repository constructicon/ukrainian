#!/usr/bin/env bash

for file in *.yml; do
    yamllint $file
done
