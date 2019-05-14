default: help

up:
	docker-compose up -d

destroy:
	docker-compose down

stop:
	docker-compose stop

start:
	docker-compose up -d

help: ## This help message
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' -e 's/:.*#/: #/' | column -t -s '##'
