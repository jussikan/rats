#!/bin/bash

echo -n `printenv CONFIG_SERVICE_DEFAULT`

let i=0
for e in $*; do
	echo -n "$i($e) "
	((i++))
done

exit 0

