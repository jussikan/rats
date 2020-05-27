#!/bin/bash

last="${@:~0}"
file=$last

set -- "${@:1:$(($#-1))}"
argv=$@

echo -en $argv > $file
