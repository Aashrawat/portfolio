/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: FEB10
*/
#ifndef SENECA_TEAM_H
#define SENECA_TEAM_H

#include <string>
#include <iostream>
#include "character.h"

namespace seneca {

    class Team {
        std::string m_name{};
        Character** m_members{};
        size_t m_size{};

    public:
        // constructors & destructor
        Team();
        Team(const char* name);
        ~Team();

        // Rule of 5
        Team(const Team& other);
        Team& operator=(const Team& other);
        Team(Team&& other) noexcept;
        Team& operator=(Team&& other) noexcept;

        // functionality
        void addMember(const Character* c);
        void removeMember(const std::string& name);

        // operators
        Character* operator[](size_t idx) const;

        // display
        void showMembers() const;
    };

}

#endif