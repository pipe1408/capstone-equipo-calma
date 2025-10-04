package com.capstone.calma;

import org.springframework.boot.SpringApplication;

public class TestCalmaApplication {

	public static void main(String[] args) {
		SpringApplication.from(CalmaApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
